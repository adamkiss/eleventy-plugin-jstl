// @ts-check

/**
  Tagged template HTML rendering.

  This is a combination of xhtm (https://github.com/dy/xhtm) by Dmitry Ivanov
  and vhtml (https://github.com/developit/vhtml) by Jason Miller.

  I (Aral) was initially mantaining separate forks of them but parsing
  tagged templates into hyperscript and rendering them into HTML is fiddly
  enough to get your head around without having two modules interacting with
  each other in the way these two did.

  Given how fundamental rendering templates to HTML is to Kitten, I’m
  inlining them here with an eye towards removing redudancy and hopefully
  simplifying the interaction between the two in the future (as I don’t need
  the flexibility of having them work independently) and being able to
  iterate faster on authoring features that are impacted by the renderer.

  Original vhtml code is Copyright © 2015-present Jason Miller (MIT license).
  Original xhtm code is Copyright © 2019-present Dmitry Ivanov (MIT license).

  Any modifications are Copyright © 2023-present Aral Balkan
  and released under AGPL version 3.0 as is the rest of Kitten.
*/

import { randomBytes } from 'node:crypto'

import MarkdownIt from 'markdown-it'
import markdownItAnchor from 'markdown-it-anchor'
import markdownItFootNote from 'markdown-it-footnote'
import markdownItImageFigures from 'markdown-it-image-figures'
import markdownItIns from 'markdown-it-ins'
import markdownItMark from 'markdown-it-mark'
import markdownItSub from 'markdown-it-sub'
import markdownItSup from 'markdown-it-sup'
import markdownItHighlightJS from 'markdown-it-highlightjs'
import markdownItTOC from 'markdown-it-toc-done-right'

import slugify from '@sindresorhus/slugify'

export { h as hyperscriptToHtmlString }
export const html = htm.bind(h)

const contentTagRegExp = /<content.*?for=['"]?(.*?)['"]?>(.*?)<\/content>/s

const specialBaseLayoutComponentSlots = ['HTML', 'HEAD', 'START_OF_BODY', 'BEFORE_LIBRARIES', 'AFTER_LIBRARIES', 'END_OF_BODY']

const markdown = new MarkdownIt({
  html: true,
  typographer: true,
  linkify: true
})
.use(markdownItAnchor, {
  // TODO: Make permalinks an option people can specify on the page. We don’t
  // have a page options feature yet so this is currently commented out.
  // permalink: markdownItAnchor.permalink.headerLink({ safariReaderFix: true })
  // TODO: Now that Markdown is rendered here, how would we set this?

  slugify: s => slugify(s)
})
.use(markdownItFootNote)
.use(markdownItImageFigures, {
  figcaption: "title"
})
.use(markdownItIns)
.use(markdownItMark)
.use(markdownItSub)
.use(markdownItSup)
.use(markdownItHighlightJS)
.use(markdownItTOC, {
  slugify: s => slugify(s)
})

////////////////////////////////////////////////////////////////////////////////
// xhtm
////////////////////////////////////////////////////////////////////////////////

const FIELD                 = '\ue000',
      QUOTES                = '\ue001',
      COMPONENT_IN_MARKDOWN = '\ue002',
      IF_IN_MARKDOWN        = '\ue003',
      END_IF_IN_MARKDOWN    = '\ue004',
      THEN_IN_MARKDOWN      = '\ue005',
      END_THEN_IN_MARKDOWN  = '\ue006',
      ELSE_IN_MARKDOWN      = '\ue007',
      END_ELSE_IN_MARKDOWN  = '\ue008',
      LESS_THAN_IN_SCRIPT   = '\ue009'

const regExp = {
  IF_IN_MARKDOWN                             : /<if.+?>/g,
  END_IF_IN_MARKDOWN                         : /<\/if>/g,
  THEN_IN_MARKDOWN                           : /<then>/g,
  END_THEN_IN_MARKDOWN                       : /<\/then>/g,
  ELSE_IN_MARKDOWN                           : /<else>/g,
  END_ELSE_IN_MARKDOWN                       : /<\/else>/g,
  COMPONENT_IN_MARKDOWN                      : /<\ue000.*?\/>/g,
  COMPONENT_WRAPPED_IN_PARAGRAPH_IN_MARKDOWN : /<p>\ue002<\/p>/g,
  IF_WRAPPED_IN_PARAGRAPH_IN_MARKDOWN        : /<p>\ue003<\/p>/g,
  END_IF_WRAPPED_IN_PARAGRAPH_IN_MARKDOWN    : /<p>\ue004<\/p>/g,
  THEN_WRAPPED_IN_PARAGRAPH_IN_MARKDOWN      : /<p>\ue005<\/p>/g,
  END_THEN_WRAPPED_IN_PARAGRAPH_IN_MARKDOWN  : /<p>\ue006<\/p>/g,
  ELSE_WRAPPED_IN_PARAGRAPH_IN_MARKDOWN      : /<p>\ue007<\/p>/g,
  END_ELSE_WRAPPED_IN_PARAGRAPH_IN_MARKDOWN  : /<p>\ue008<\/p>/g,

  LESS_THAN_IN_SCRIPT                        : /\ue009/g
}

const map = { '&':'amp', '<':'lt', '>':'gt', '"':'quot', "'":'apos' }

/**
  Replaces common entities in string with HTML entities.

  @param {string} string - String to escape.
  @returns {string} Escaped string.
*/
const escape = string => String(string).replace(/[&<>"']/g, s => `&${map[s]};`)

/**
  Converts passed array of static strings and interpolation arguments
  recevied by the html tagged template to hyperscript.

  @param {string[]} statics
*/
function htm (statics) {
  let h = this, prev = 0, current = [null], field = 0, args, name, value, quotes = [], quote = 0, last, level = 0, pre = false

  const evaluate = (str, parts = [], raw) => {
    let i = 0
    str = (!raw && str === QUOTES ?
      quotes[quote++].slice(1,-1) :
      str.replace(/\ue001/g, () => quotes[quote++]))

    if (!str) return str
    str.replace(/\ue000/g, (_match, idx) => {
      if (idx) parts.push(str.slice(i, idx))
      i = idx + 1
      let fieldContents = arguments[++field]
      if (typeof fieldContents === 'string') {
        fieldContents = fieldContents.includes(h.token) ? fieldContents.replace(h.token, '') : escape(fieldContents)
      }
      return parts.push(fieldContents)
    })
    if (i < str.length) parts.push(str.slice(i))
    return parts.length > 1 ? parts : parts[0]
  }

  // close level
  const up = () => {
    [current, last, ...args] = current
    current.push(h(last, ...args))
    if (pre === level--) pre = false // reset preformatted tags
  }

  let str = statics
    .join(FIELD)

    // Scripts: substitute less thans so they do not confuse the parser.
    .replace(/<script(.*?)>(.*?)<\/script>/gs, (match, p1, p2) => {
      const attributesIfAny = p1
      const scriptWithLessThansSubstituted = p2.replace(/</g, LESS_THAN_IN_SCRIPT)
      return `<script${attributesIfAny}>${scriptWithLessThansSubstituted}</script>`
    })

    // Markdown.
    .replace(/<markdown>(.*?)<\/markdown>/gs, (_match, p1) => {
      // Keep a list of any components there may be in the Markdown
      // and replace them with a special token so we can return
      // them after the Markdown parsing is complete. Afterwards,
      // apply any transformations and/or syntax extensions
      // we have and then actually render the markdown.
      const components = []
      const conditionals = []
      p1 = p1
        .replaceAll(regExp.COMPONENT_IN_MARKDOWN, match => {
          components.push(match)
          return COMPONENT_IN_MARKDOWN
        })
        .replaceAll(regExp.IF_IN_MARKDOWN, match => {
          conditionals.push(match)
          return IF_IN_MARKDOWN
        })
        .replace(regExp.END_IF_IN_MARKDOWN, END_IF_IN_MARKDOWN)
        .replace(regExp.THEN_IN_MARKDOWN, THEN_IN_MARKDOWN)
        .replace(regExp.END_THEN_IN_MARKDOWN, END_IF_IN_MARKDOWN)
        .replace(regExp.ELSE_IN_MARKDOWN, ELSE_IN_MARKDOWN)
        .replace(regExp.END_ELSE_IN_MARKDOWN, END_ELSE_IN_MARKDOWN)
        // [code] syntactic sugar for \`\`\`
        .replace(/\[code\]/g, '```')
        // [code language] syntactic sugar for \`\`\`language
        .replace(/\[code\s*?(.*?)\]/g, '```$1')

      // Since Markdown is whitespace sensitive, calculate indentation level
      // of the markdown tag’s contents, so we can ignore it when rendering.
      let initialIndent = ''
      const lines = p1.split('\n')
      if (lines.length > 1) {
        let index = 0
        while (index < lines.length) {
          if (lines[index] === '') {
            index++ // skip intial empty lines
          } else {
            break
          }
        }
        initialIndent = lines[index].match(/^\s+?(?=[^\s])/)
      }
      const initialIndentRegExp = new RegExp(`^${initialIndent}`, 'gm')
      const normalisedMarkdown = initialIndent !== '' ? p1.replace(initialIndentRegExp, '') : p1
      let renderedMarkdown = markdown.render(normalisedMarkdown)

      // Components and conditional tags placed by themselves
      // on a line are wrapped in paragraphs by the Markdown parser.
      // Make sure we remove this extra paragraph wrapping first so
      // we don’t result in HTML validation errors, etc.
      renderedMarkdown = renderedMarkdown
        .replace(regExp.COMPONENT_WRAPPED_IN_PARAGRAPH_IN_MARKDOWN, COMPONENT_IN_MARKDOWN)
        .replace(regExp.IF_WRAPPED_IN_PARAGRAPH_IN_MARKDOWN, IF_IN_MARKDOWN)
        .replace(regExp.END_IF_WRAPPED_IN_PARAGRAPH_IN_MARKDOWN, END_IF_IN_MARKDOWN)
        .replace(regExp.THEN_WRAPPED_IN_PARAGRAPH_IN_MARKDOWN, THEN_IN_MARKDOWN)
        .replace(regExp.END_THEN_WRAPPED_IN_PARAGRAPH_IN_MARKDOWN, END_THEN_IN_MARKDOWN)
        .replace(regExp.ELSE_WRAPPED_IN_PARAGRAPH_IN_MARKDOWN, ELSE_IN_MARKDOWN)
        .replace(regExp.END_ELSE_WRAPPED_IN_PARAGRAPH_IN_MARKDOWN, END_ELSE_IN_MARKDOWN)

      // Place the components back where they were so they can be
      // rendered by the HTML renderer.
      components.forEach(component => {
        renderedMarkdown = renderedMarkdown.replace(/\ue002/, component)
      })

      // Replace conditionals back where they were so they can be
      // rendered by the HTML renderer.
      conditionals.forEach(conditional => {
        renderedMarkdown = renderedMarkdown.replace(/\ue003/, conditional)
      })

      renderedMarkdown = renderedMarkdown
        .replace(/\ue004/g, '</if>')
        .replace(/\ue005/g, '<then>')
        .replace(/\ue006/g, '</then>')
        .replace(/\ue007/g, '<else>')
        .replace(/\ue008/g, '</else>')

      return renderedMarkdown
    })

    .replace(/<!--[^]*?-->/g, '')
    .replace(/<!\[CDATA\[[^]*\]\]>/g, '')
    .replace(/('|")[^\1]*?\1/g, match => (quotes.push(match), QUOTES))

    // ...>text<... sequence
    str.replace(/(?:^|>)([^<]*)(?:$|<)/g, (match, text, idx, str) => {
      let tag, close

      if (idx) {
        str.slice(prev, idx)
          // <abc/> → <abc />
          .replace(/(\S)\/$/, '$1 /')
          .split(/\s+/)
          .map((part, i) => {
            // </tag>, </> .../>
            if (part[0] === '/') {
              part = part.slice(1)
              // ignore duplicate empty closers </input>
              if (EMPTY[part]) return
              // ignore pairing self-closing tags
              close = tag || part || 1
              // skip </input>
            }
            // <tag
            else if (!i) {
              tag = evaluate(part)
              // <p>abc<p>def, <tr><td>x<tr>
              if (typeof tag === 'string') { tag = tag.toLowerCase(); while (CLOSE[current[1]+tag]) up() }
              current = [current, tag, null]
              level++
              if (!pre && PRE[tag]) pre = level
              if (EMPTY[tag]) close = tag
            }
            // attr=...
            else if (part) {
              let props = current[2] || (current[2] = {})
              if (part.slice(0, 3) === '...') {
                Object.assign(props, arguments[++field])
              }
              else {
                [name, value] = part.split('=');
                Array.isArray(value = props[evaluate(name)] = value ? evaluate(value) : true) &&
                // if prop value is array - make sure it serializes as string without csv
                (value.toString = value.join.bind(value, ''))
              }
            }
          })
      }

      if (close) {
        // Syntax error when, e.g., a <div> is nested in a <p>. Since we allow
        // <p> tags without closing tags, a <p><div></div></p> will be translated
        // as <p></p><div></div></p> because we close the <p> tag when we see the
        // next flow container (the div tag) and the error occurs on the (now)
        // unexpected second </p> tag.
        if (!current[0]) {
          // Grab the whole line that the error is on to try and provide some context
          // to aid in locating the error. (The stack trace should have the exact
          // location of the error insofar as the Node runtime is concerned but this
          // narrows it down within the HTML template itself.)

          // prev holds the start of the error location
          let errorLineStart = prev
          while (errorLineStart > 0 && str[errorLineStart - 1] !== '\n') {
            errorLineStart--
          }
          htmlSyntaxError(`Unexpected close tag (<code>${close}</code>): <code>${kitten.html`${str.substring(errorLineStart, prev + close.length + 2)}`}</code><p> <small>(Check you haven’t put <a href='https://html.spec.whatwg.org/#flow-content-2'>flow content</a> where <a href='https://html.spec.whatwg.org/#phrasing-content'>phrasing content</a> is expected (e.g., <a href='https://caninclude.glitch.me/caninclude?child=div&parent=p'>a &lt;div&gt; inside a &lt;p&gt; tag</a>, etc.)</small></p>`)
        }
        up()
        // If last child is optionally closable, close it too.
        while (last !== close && CLOSE[last]) up()
      }
      prev = idx + match.length

      // Fix text indentation.
      if (!pre) text = text.replace(/\s*\n\s*/g,'').replace(/\s+/g, ' ')

      if (text) evaluate((last = 0, text), current, true)
    })

  if (current[0] && CLOSE[current[1]]) up()

  if (level) htmlSyntaxError(`Unclosed \`${current[1]}\`.`)

  return current.length < 3 ? current[1] : (current.shift(), current)
}

class KittenSyntaxError extends Error {
  constructor(message, relevantCode = null) {
    super(message)
    this.relevantCode = relevantCode
    this.name = 'Syntax Error'
  }
}
const htmlSyntaxError = (message, relevantCode) => {
  throw new KittenSyntaxError(message, relevantCode)
}

// Self-closing elements.
const EMPTY = htm.empty = {}

// Optional closing elements.
const CLOSE = htm.close = {}

// Preformatted text elements.
const PRE = htm.pre = {}

'area base br col command embed hr img input keygen link meta param source track wbr ! !doctype ? ?xml page'.split(' ').map(v => htm.empty[v] = true)

// Closed by the corresponding tag or end of parent content.
// https://html.spec.whatwg.org/multipage/syntax.html#optional-tags
let close = {
  'li': '',
  'dt': 'dd',
  'dd': 'dt',
  'p': 'address article aside blockquote details div dl fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hgroup hr main menu nav ol pre section table',
  'rt': 'rp',
  'rp': 'rt',
  'optgroup': '',
  'option': 'optgroup',
  'caption': 'tbody thead tfoot tr colgroup',
  'colgroup': 'thead tbody tfoot tr caption',
  'thead': 'tbody tfoot caption',
  'tbody': 'tfoot caption',
  'tfoot': 'caption',
  'tr': 'tbody tfoot',
  'td': 'th tr',
  'th': 'td tr tbody',
  'then': 'else',
  'else': ''
}
for (let tag in close) {
  for (let closer of [...close[tag].split(' '), tag])
    htm.close[tag] = htm.close[tag + closer] = true
}

// Preformatted tags.
'pre textarea markdown script style'.split(' ').map(v => htm.pre[v] = true)

////////////////////////////////////////////////////////////////////////////////
// vhtml
////////////////////////////////////////////////////////////////////////////////

// List of HTML tags that don’t have content.
// Note: this is almost the same as the list used by xhtm (above) but that
// ===== adds a few more, the purpose of which I’m not entirely sure about.
// TODO: Refactor to remove redundancy.
const emptyTags = [
  'area', 'base', 'br', 'col', 'command', 'embed', 'hr',
  'img', 'input', 'keygen', 'link', 'meta', 'param',
  'source', 'track', 'wbr'
]

/**
  To comply with “text must not contain the character U+003C LESS-THAN SIGN (<)”
  https://html.spec.whatwg.org/multipage/syntax.html#normal-elements

  @param {string} string
  @return {string}
*/
// const escapeSolitaryLessThan = string => String(string).replace(/<(\s)/g, '&lt;$1')

// To enable raw HTML.
const setInnerHTMLAttr = 'dangerouslySetInnerHTML'

const DOMAttributeNames = {
  className: 'class',
  htmlFor: 'for'
}

/** Hyperscript reviver that constructs sanitised HTML string. */
function h(name, attrs) {
  let stack=[], s = ''

  attrs = attrs || {}
  for (let i=arguments.length; i-- > 2; ) {
    stack.push(arguments[i])
  }

  // Functions are components and they support both
  // unnamed (default) and named slots. Note that if there are named
  // slots any unnamed child content will be in SLOT.default.
  //
  // If a class attribute is set on the component, it is passed in
  // using the special CLASS property.
  //
  // Special properties injected by Kitten as written in ALL CAPS
  // to differentiate them from properties declared by authors to
  // ensure that they do not clash. (In the case of CLASS, it also
  // means that we do not clash with JavaScript’s CLASS keyword).
  if (typeof name==='function') {
    const namedSlots = {}
    let slots = stack.reverse()
    slots = slots.filter(item => {
      if (item === false || item === undefined || item === null) return false
      if (Array.isArray(item)) {
        item = item.flat(Infinity).join('\n')
      } else if (typeof item === 'object') {
        // If this is a named slot object, pass it through.
        return true
      }

      const match = item.match(contentTagRegExp)
      if (match === null) {
        // This is just regular DOM content, pass it through,
        // It will end up in the default slot.
        return true
      } else {
        // This is content addressed for a named slot, remove it from the
        // rest of the DOM content and add it to the list of content for
        // that named slot.

        const slotName = match[1]

        // If the slot is a special Kitten slot from the
        // base layout component (HTML, HEAD, START_OF_BODY, BEFORE_LIBRARIES,
        // AFTER_LIBRARIES, or END_OF_BODY), let it through. The final page
        // render will handle them.
        if (specialBaseLayoutComponentSlots.includes(slotName)) {
          return true
        }

        const slotContents = [match[2]]
        if (namedSlots[slotName] === undefined) {
          namedSlots[slotName] = []
        }
        namedSlots[slotName].push(slotContents)
        return false
      }
    })

    // Any content left in the slots is transferred to the default slot.
    slots = Object.assign(namedSlots, {default: slots})

    // Flatten out nested content.
    if (slots.default) slots.default = slots.default.flat(Infinity)

    attrs.SLOT = slots

    // Allow ${SLOT} to be used as shorthand for ${SLOT.default}
    // to make authoring nicer.
    attrs.SLOT.toString = function () {
      return this.default.flat(Infinity).join('\n')
    }

    // Handle seamless class passing to components.
    if (attrs.class !== undefined) {
      // Additional classes are being passed to the child component
      // but they cannot be destructured as “class” as that’s a keyword
      // in JavaScript so we adhere to our convention that magic Kitten
      // objects/globals are written in ALL CAPS and rename it to CLASS.
      attrs.CLASS = attrs.class
      delete attrs.class
    }
    return name(attrs)
  }

  // Kitten HTML extension: <if> conditional tag (and optional <then> and <else> tags).
  if (name === 'if') {
    // This is a conditional in the form
    //
    // <if ${condition}>
    //   <then>
    //     <!-- markup -->
    //   </then>
    //   <else>
    //     <!-- markup -->
    //   </else>
    // </if>
    //
    // Note: the <then> and <else> tags are actually
    // optional. As long as you provide a single tag for the
    // true and false conditions, they will be rendered correctly.
    // However, an <if> tag with more than two children will throw
    // a syntax error.
    const state = attrs.true

    let trueMarkup = stack.pop()
    if (trueMarkup) trueMarkup = trueMarkup.replace('<then>', '').replace('</then>', '')
    if (state) s+= trueMarkup

    if (stack.length > 0) {
      let falseMarkup = stack.pop()
      if (falseMarkup) falseMarkup = falseMarkup.replace('<else>', '').replace('</else>', '')
      if (!state) s+= falseMarkup
    }

    // At this point, the stack should be empty.
    if (stack.length > 0) {
      let relevantCode = stack.pop()
      htmlSyntaxError('&lt;if&gt; conditional has unexpected content', relevantCode)
    }

    return s
  }

  if (name) {
    s += '<' + name
    if (attrs) for (let i in attrs) {
      if (attrs[i]!==false && attrs[i]!=null) {
        // To comply with https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
        // Note the additional check for boolean attribute values e.g.,
        // h('p', {hidden: true}) which should render as <p hidden> not <p hidden="true">
        s += ` ${DOMAttributeNames[i] ? DOMAttributeNames[i] : escape(i)}${attrs[i] === true ? '' : `="${escape(attrs[i])}"`}`
      }
    }
    s += '>'
  }

  if (emptyTags.indexOf(name) === -1) {
    if (attrs[setInnerHTMLAttr]) {
      s += attrs[setInnerHTMLAttr].__html + h.token
    } else {
      while (stack.length) {
        let child = stack.pop()
        if (child !== false && child !== undefined && child !== null) {
          if (child.pop) {
            for (let i=child.length; i--; ) stack.push(child[i])
          }
          else {
            if (child.replace) {
              s += child.replace(regExp.LESS_THAN_IN_SCRIPT, '<')
            } else {
              s += child
            }
          }
        }
      }
    }

    s += name ? `</${name}>` : ''
  }

  return s
}

// We use this token to signal between xhtm and
// vhtml that a field does not need to be escaped.
// It’s cryptographically random so there isn’t a
// chance in hell that anyone can actually inject
// it into their input to bypass escaping. (In fact,
// this is way overkill for our needs but hey, it’s
// fast enough so why not?) :)
h.token = randomBytes(32).toString('hex')
