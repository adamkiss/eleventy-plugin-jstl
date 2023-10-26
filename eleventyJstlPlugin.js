const fg = require('fast-glob')

const path = require('node:path')

function extract(data, where) {
    var g = where || (typeof global !== 'undefined' ? global : this);
    for (var key in data){
      if (data.hasOwnProperty(key)){
          g[key] = data[key];
      }
    }
}

function htmEval (html, page, data, components) {
	try {
		extract(data)
		extract(components)

		// const Layout = _ => '';

		return eval(`html\`${page}\``)
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
			const __vhtml = (await import('vhtml')).default
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
				console.log(content, data)
				const result = htmEval(html, content, data, components)
				return result;
			}
		}
	});
}
