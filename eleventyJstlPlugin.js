const fg = require('fast-glob')
const {stringify} = require("javascript-stringify");
const path = require('node:path')

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
		// extract(data)
		// extract(components)

		// const Layout = _ => '';

		return eval(`${
			objectToString(data)
		}${
			objectToString(components)
		}\n\n html\`${page}\``)
	} catch (error) {
		console.error(error)
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
			componentFiles.forEach(file => {
				const [_, name, extension] = file.match(/\/([^\/\.]*?)\.(.*)$/)

				if (extension === 'jstl.js') {
					components[name] = require(path.resolve(file))(html)
					return
				}

				// components[name] =
			})
		},
		compile: async function(content, file) {
			return async data => {
				let result = htmEval(html, content, data, components)

				if (Array.isArray(result))
					result = result.join('')

				result = result.replace('<!doctype html></!doctype>', '<!doctype html>');

				return result;
			}
		}
	});
}
