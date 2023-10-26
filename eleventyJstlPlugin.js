// const { TemplatePath } = require("@11ty/eleventy-utils");
const fg = require('fast-glob')
const {stringify} = require("javascript-stringify");
const path = require('node:path')
const TemplateEngine = require("@11ty/eleventy/src/Engines/TemplateEngine");

function extract(data, where) {
    var g = where || (typeof global !== 'undefined' ? global : this);
    for (var key in data){
      if (data.hasOwnProperty(key)){
          g[key] = data[key];
      }
    }
}

function objectToString(obj, skipKeys = ['collections']) {
	return Object.keys(obj).map(key => {
		if (skipKeys.includes(key)) return ''

		return `const ${key} = ${stringify(obj[key], null, null, {circular: true})};`
	}).join('\n')
}

function htmEval (html, page, data, components) {
	try {
		return eval(`${
			objectToString(data)
		}${
			objectToString(components)
		}\n\n html\`${page}\``)
	} catch (error) {
		console.error(error)
	}
}

function jsWrap (name, path, html, page, data, components) {
	try {

	} catch (error) {
		return []
	}
}

class Page {
	constructor(content) {
		this.__content = content
	}
	async render(html) {
		try {
			return eval(`html\`${this.__content}\``)
		} catch (error) {
			console.error(error)
		}
	}
}

module.exports = function (ec, options = {}) {
	let html
	let components = {}

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

			const folders = [...new Set([ec.dir.layouts, ec.dir.includes, 'thisdoesntexistitsforglob'].filter(Boolean))]
			const componentFiles = await fg.glob([
				`test/sample-1/{${folders.join(',')}}/**/*.jstl.js`,
				`test/sample-1/{${folders.join(',')}}/**/*.jstl`,
			]);
// 			componentFiles.forEach(file => {
// 				const [_, name, extension] = file.match(/\/([^\/\.]*?)\.(.*)$/)
//
// 				if (extension === 'jstl.js') {
// 					components[name] = require(path.resolve(file))(html)
// 					return
// 				}
//
// 				// components[name] =
// 			})
		},
		compile: async function(content, file) {
			// Load dependencies
			const dependenciesPromises = ([...content.matchAll(/<\$\{([^\s\.]*?)\}/g)]?.map(m => m[1]) || [])
				.map(async dep => await fg.glob(`${this.config.dir.includes}/**/${dep}.{jstl.js,jstl}`, {cwd: path.resolve(this.config.inputDir)}))
			const dependencies = (await Promise.all(dependenciesPromises)).flat()
			console.log(dependencies)

			return async data => {
				try {
					let result = htmEval(html, content, data, components)

					if (Array.isArray(result))
						result = result.join('')

					result = result.replace('<!doctype html></!doctype>', '<!doctype html>');

					return result;
				} catch (error) {
					return 'ERROR';
				}
			}
		}
	});
}
