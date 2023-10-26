// const { TemplatePath } = require("@11ty/eleventy-utils");
const fg = require('fast-glob')
const {stringify} = require("javascript-stringify");
const path = require('node:path')
const {readFile} = require('node:fs/promises')
const TemplateEngine = require("@11ty/eleventy/src/Engines/TemplateEngine");
const JavaScript = require("@11ty/eleventy/src/Engines/JavaScript");
const ray = require('node-ray').ray
const slugify = require('@11ty/eleventy/src/filters/Slugify')
const url = require('@11ty/eleventy/src/filters/Url')

function extract(data, where) {
    var g = where || (typeof global !== 'undefined' ? global : this);
    for (var key in data){
      if (data.hasOwnProperty(key)){
          g[key] = data[key];
      }
    }
}

function addContextToJavaScriptFunction(data, fn) {
	let CONTEXT_KEYS = ["eleventy", "page"];
	return function (...args) {
		for (let key of CONTEXT_KEYS) {
			if (data && data[key]) {
				this[key] = data[key];
			}
		}

		return fn.call(this, ...args);
	};
}

function objectToString(obj, skipKeys = ['collections']) {
	return Object.keys(obj).map(key => {
		if (skipKeys.includes(key)) return ''

		return `const ${key} = ${stringify(obj[key], null, null, {circular: true})};`
	}).join('\n')
}

function htmEval (html, source, data, components) {
	try {
		return eval(`${
			objectToString(data)
		}${
			objectToString(components)
		}\n\n html\`${source}\``)
	} catch (error) {
		console.error(error)
	}
}

function jsEval (source) {
	// console.log("JS eval", source)

	try {
		return eval(`({children, ...props}) => {${source}}`)
	} catch (error) {
		console.error(error)
	}
}

/**
 * Create a component function out of simplified js source code
 * by wrapping it in two functions: (html) => (data) => { ... }
 * @param {string} name Name of the component
 * @param {string} path absolute path to the file
 * @param {function} html html tagged template function
 * @returns
 */
async function createComponent (name, path, html) {
	try {
		const source = await readFile(path, 'utf-8')
		const component = jsEval(source)

		return [name, component]
	} catch (error) {
		return [name, new Function(`return "<jstl-error>${error.message}</jstl-error>"`)]
	}
}

module.exports = function (ec, options = {}) {
	const opts = Object.assign({
		skipAttrHelper: false
	}, options)

	let html
	let components = {}
	let helpers = {}

	ec.addTemplateFormats("jstl.js")
	ec.addExtension("jstl.js", {
		outputFileExtension: "html",
		compileOptions: {},
		init: async function() {
			console.log('Jstl.JS init')
			console.log(this.config.dir.input)
		},
		compile: async function(content, file) {
			console.log(content, file)

			return async data => {
				console.log(data)
				return ':)'
			}
		}
	})

	ec.addTemplateFormats("jstl")
	ec.addExtension("jstl", {
		outputFileExtension: "html",
		compileOptions: {},
		init: async function(...args) {
			const __xhtm = (await import('xhtm')).default
			const __vhtml = (await import('@small-tech/hyperscript-to-html-string')).default
			html = __xhtm.bind(__vhtml)

			const componentsDir = path.join(path.resolve(this.config.inputDir), this.config.dir.includes)
			const componentFiles = await fg.glob(`${componentsDir}/**/*.{jstl.js,jstl}`)
			const componentFunctions = (await Promise.all(componentFiles.map(async file => {
				const [_, name, extension] = file.match(/\/([^\/\.]*?)\.(.*)$/)

				if (extension === 'jstl.js') {
					return await createComponent(name, file, html)
				}

				return false
			}))).filter(Boolean)

			components = Object.fromEntries(componentFunctions)

		},
		compile: async function(content, file) {
			// Load dependencies
			// const dependenciesPromises = ([...content.matchAll(/<\$\{([^\s\.]*?)\}/g)]?.map(m => m[1]) || [])
			// 	.map(async dep => await fg.glob(`${this.config.dir.includes}/**/${dep}.{jstl.js,jstl}`, {cwd: path.resolve(this.config.inputDir)}))
			// const dependencies = (await Promise.all(dependenciesPromises)).flat()


			return async data => {
				let helpers = {}
				const dataWithStuff = Object.assign({
					'$f': {
						attr: (...args) => require('clsx')(...args),
						...helpers
					},
				}, data)

				try {
					let result = (htmEval.bind({benchmark: 'ohno'}))(html, content, dataWithStuff, components)

					if (Array.isArray(result))
						result = result.join('')

					result = result.replace('<!doctype html></!doctype>', '<!doctype html>');

					return result;
				} catch (error) {
					// return `ERROR: ${error}`;
					throw error;
				}
			}
		}
	});

	if (!opts.skipAttrHelper) {
		ec.addFilter('attr', (...args) => require('clsx')(...args));
	}
}
