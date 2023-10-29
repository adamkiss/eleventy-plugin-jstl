// List of HTML tags that don’t have content.
const emptyTags = [
	'area', 'base', 'br', 'col', 'command', 'embed', 'hr',
	'img', 'input', 'keygen', 'link', 'meta', 'param',
	'source', 'track', 'wbr'
]

// Escaping.
const map = {'&':'amp','<':'lt','>':'gt','"':'quot',"'":'apos'}

// To comply with https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
const escapeAttributes = str => String(str).replace(/[&<>"']/g, s => `&${map[s]};`)

// To comply with “text must not contain the character U+003C LESS-THAN SIGN (<)”
// https://html.spec.whatwg.org/multipage/syntax.html#normal-elements
const escapeSolitaryLessThan = str => String(str).replace(/<(\s)/g, '&lt;$1')

const DOMAttributeNames = {
	className: 'class',
	htmlFor: 'for'
}

/** Hyperscript reviver that constructs sanitised HTML string. */
export default async function h(name, attrs) {
	let stack=[], s = ''
	attrs = attrs || {}
	for (let i=arguments.length; i-- > 2; ) {
		stack.push(arguments[i])
	}

	// Sortof component support!
	if (typeof name==='function') {
		attrs.children = stack.reverse()
		return await name(attrs)
		// return name(attrs, stack.reverse())
	}

	if (name) {
		s += '<' + name
		if (attrs) for (let i in attrs) {
			if (attrs[i]!==false && attrs[i]!=null) {
				// Note the additional check for boolean attribute values e.g.,
				// h('p', {hidden: true}) which should render as <p hidden> not <p hidden="true">
				s += ` ${DOMAttributeNames[i] ? DOMAttributeNames[i] : escapeAttributes(i)}${attrs[i] === true ? '' : `="${escapeAttributes(attrs[i])}"`}`
			}
		}
		s += '>'
	}

	if (emptyTags.indexOf(name) === -1) {
		while (stack.length) {
			let child = stack.pop()
			if (child) {
				if (child.pop) {
					for (let i=child.length; i--; ) stack.push(child[i])
				}
				else {
					s += escapeSolitaryLessThan(child)
				}
			}
		}

		s += name ? `</${name}>` : ''
	}

	return s
}
