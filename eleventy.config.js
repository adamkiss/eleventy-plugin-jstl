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
const matter = require('gray-matter')

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

module.exports = function (ec, options = {}) {


	// OPTIONS //////////////////////////////////////////////////////////////////////////
	const opts = Object.assign({
		skipAttrHelper: false,
		warnOnEmptyResult: true,
		useCustomFrontmatterForJs: true
	}, options)

	let html
	const components = new ComponentManager()

	// Load HTML tag and Components, asynchronously, before everything
	ec.on('eleventy.before', async function ({inputDir, dir}) {
		if (!html) html = await loadHtmlTag()

		components.root = [inputDir, dir.includes]
		await components.load(html)
	})


	// JSTL.JS EXTENSION  //////////////////////////////////////////////////////////////
	const javascriptExtension = {
		outputFileExtension: "html",
		compileOptions: {},
		init: async function() {},
		compile: async function(source, name) {
			if (opts.useCustomFrontmatterForJs)
				source = source.replace(/\/\/---.*?\/\/---\s+/gs, '')

			return async eleventyData => {
				const data = eleventyDataForPage(eleventyData)
				const pageFunction = evaluate.asFunction({
					html, name, source, data,
					components: components.get()
				}).bind({...ec.javascriptFunctions})

				try {
					// if data.content exists, it means we are in a layout call
					// from eleventy, so we convert the "content"
					// into hyperscript children array
					let result = pageFunction({
						children: ('content' in data) ? [data.content] : []
					})

					if (!result && options.warnOnEmptyResult) {
						throw new Error(`Empty result for ${file}`)
					}

					if (Array.isArray(result))
						result = result.join('')

					if (result)
						result = result
							.replace('<!doctype html></!doctype>', '<!doctype html>')
							.replace('<!doctype html/>', '<!doctype html>')

					return result;
				} catch (error) {
					console.error(error)
					return `ERROR: ${error}`;
				}
			}
		}
	}
	if (opts.useCustomFrontmatterForJs)
		javascriptExtension.getData = async function(file) {
			const content = await readFile(file, 'utf-8')
			const {data} = matter(content, {delimiters: ['//---', '//---']})
			return data
		}
	ec.addTemplateFormats("jstl.js")
	ec.addExtension("jstl.js", javascriptExtension)


	// JSTL EXTENSION  /////////////////////////////////////////////////////////////////
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


	// HELPERS //////////////////////////////////////////////////////////////////////////
	if (opts.skipFilters === true)
		return

	if (!opts.skipFilterAttr) {
		ec.addFilter('attr', (...args) => require('clsx')(...args));
	}
}
