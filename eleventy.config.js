// const { TemplatePath } = require("@11ty/eleventy-utils");
const fg = require('fast-glob')
const {stringify} = require("javascript-stringify");
const path = require('node:path')
const {readFile} = require('node:fs/promises')
const {writeFileSync} = require('node:fs')
const TemplateEngine = require("@11ty/eleventy/src/Engines/TemplateEngine");
const JavaScript = require("@11ty/eleventy/src/Engines/JavaScript");
const ray = require('node-ray/web').ray
const slugify = require('@11ty/eleventy/src/filters/Slugify')
const url = require('@11ty/eleventy/src/filters/Url')
const loadHtmlTag = require('./src/html.cjs')
const TemplatePath = require('@11ty/eleventy-utils')
const ComponentManager = require('./src/ComponentManager')
const evaluate = require('./src/evaluate')
const {eleventyDataForPage} = require('./src/utils')

// function extract(data, where) {
//     var g = where || (typeof global !== 'undefined' ? global : this);
//     for (var key in data){
//       if (data.hasOwnProperty(key)){
//           g[key] = data[key];
//       }
//     }
// }
//
// function addContextToJavaScriptFunction(data, fn) {
// 	let CONTEXT_KEYS = ["eleventy", "page"];
// 	return function (...args) {
// 		for (let key of CONTEXT_KEYS) {
// 			if (data && data[key]) {
// 				this[key] = data[key];
// 			}
// 		}
//
// 		return fn.call(this, ...args);
// 	};
// }
//
// function objectToString(obj, skipKeys = ['collections']) {
// 	return Object.keys(obj).map(key => {
// 		if (skipKeys.includes(key)) return ''
//
// 		return `const ${key} = ${stringify(obj[key], null, null, {circular: true})};`
// 	}).join('\n')
// }
//
// function htmEval ({
// 	html,
// 	name = "UNKNOWN", source,
// 	data = {}, components = {}
// }) {
// 	try {
// 		return eval(`${
// 			objectToString(data)
// 		}${
// 			objectToString(components)
// 		}\n\n html\`${source}\``)
// 	} catch (error) {
// 		return `JSTL ERROR in ${name}: ${error}`
// 	}
// }
//
// function pageJsEval({name, source, html, components = {}, data = {}}) {
// 	try {
// 		return eval(`${
// 			objectToString(data)
// 		}${
// 			objectToString(components)
// 		};({children, ...props}) => {${source}}`)
// 	} catch (error) {
// 		return `JSTL.JS ERROR in ${name}: ${error}`
// 	}
// }
//
// function jsEval ({name, source, html, components = {}}) {
// 	try {
// 		return eval(`({children, ...props}) => {${source}}`)
// 	} catch (error) {
// 		return `JSTL.JS ERROR in ${name}: ${error}`
// 	}
// }
//

// async function createComponent ({name, file, html, wrapWithReturn = false}) {
// 	try {
// 		const source = await readFile(file, 'utf-8')
//
// 		const component = jsEval({
// 			name,
// 			source: !wrapWithReturn ? source : `return html\`\n${source}\``,
// 			html
// 		})
// 		ray(name, stringify(component))
//
// 		return [name, component]
// 	} catch (error) {
// 		console.error(error)
// 		return [name, new Function(`return "<div>jstl-error: ${name}: ${error.message}</div>"`)]
// 	}
// }

module.exports = function (ec, options = {}) {
	const opts = Object.assign({
		skipAttrHelper: false,
		warnOnEmptyResult: true,
	}, options)

	let html
	const components = new ComponentManager()

	// Load HTML tag and Components, asynchronously, before everything
	ec.on('eleventy.before', async function ({inputDir, dir}) {
		if (!html) html = await loadHtmlTag()

		components.root = [inputDir, dir.includes]
		await components.load(html)
	})

	ec.addTemplateFormats("jstl.js")
	ec.addExtension("jstl.js", {
		outputFileExtension: "html",
		compileOptions: {},
		init: async function() {},
		compile: async function(source, name) {
			return async eleventyData => {
				const data = eleventyDataForPage(eleventyData)
				const pageFunction = evaluate.asFunction({
					html, name, source, data,
					components: components.get()
				}).bind({...ec.javascriptFunctions})

				try {
					// if data.content exists, it means we are in a layout call from eleventy,
					// so we convert the "content" into hyperscript children array
					let result = pageFunction({children: ('content' in data) ? [data.content] : []})

					if (!result && options.warnOnEmptyResult) {
						throw new Error(`Empty result for ${file}`)
					}

					if (Array.isArray(result))
						result = result.join('')

					result = result?.replace('<!doctype html></!doctype>', '<!doctype html>');

					return result;
				} catch (error) {
					console.error(error)
					return `ERROR: ${error}`;
				}
			}
		}
	})
//
// 	ec.addTemplateFormats("jstl")
// 	ec.addExtension("jstl", {
// 		outputFileExtension: "html",
// 		compileOptions: {},
// 		init: async function(...args) {
// 			if (!html) {
// 				html = await loadHtmlTag()
// 				// ec.addGlobalData('html', html)
// 			}
// 		},
// 		compile: async function(content, file) {
// 			// Load dependencies
// 			// const dependenciesPromises = ([...content.matchAll(/<\$\{([^\s\.]*?)\}/g)]?.map(m => m[1]) || [])
// 			// 	.map(async dep => await fg.glob(`${this.config.dir.includes}/**/${dep}.{jstl.js,jstl}`, {cwd: path.resolve(this.config.inputDir)}))
// 			// const dependencies = (await Promise.all(dependenciesPromises)).flat()
//
// 			return async eleventyData => {
// 				const $data = eleventyData
// 				delete $data.eleventy
// 				delete $data.collections
// 				const data = Object.assign({$data}, eleventyData)
//
// 				try {
// 					console.log(content)
// 					let result = (htmEval.bind(ec.javascriptFunctions))({
// 						html, name: file, source: content, data, components
// 					})
//
// 					if (!result && options.warnOnEmptyResult) {
// 						throw new Error(`Empty result for ${file}`)
// 					}
//
// 					if (Array.isArray(result))
// 						result = result.join('')
//
// 					result = result?.replace('<!doctype html></!doctype>', '<!doctype html>');
//
// 					console.log(result)
//
// 					return result;
// 				} catch (error) {
// 					console.error(error)
// 					return `ERROR: ${error}`;
// 				}
// 			}
// 		}
// 	});
//
// 	if (!opts.skipAttrHelper) {
// 		ec.addFilter('attr', (...args) => require('clsx')(...args));
// 	}
}
