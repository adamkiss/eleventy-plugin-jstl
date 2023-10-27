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
const ComponentManager = require('./src/ComponentManager.cjs')
const evaluate = require('./src/evaluate.cjs')
const {eleventyDataForPage} = require('./src/utils.cjs')
const matter = require('gray-matter')

module.exports = function (ec, options = {}) {


	// OPTIONS //////////////////////////////////////////////////////////////////////////
	const opts = Object.assign({
		skipAttrHelper: false,
		warnOnEmptyResult: true,
		useCustomFrontmatterForJs: true,
		keyForAllData: '$data'
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
		compile: async function(source, name) {
			if (opts.useCustomFrontmatterForJs)
				source = source.replace(/\/\/---.*?\/\/---\s+/gs, '')

			return async eleventyData => {
				const data = eleventyDataForPage(eleventyData, options)
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
	const jstlExtension = {
		outputFileExtension: "html",
		compileOptions: {},
		compile: async function(source, name) {
			return async eleventyData => {
				const data = eleventyDataForPage(eleventyData, options)

				try {
					let result = evaluate.asBody.bind(ec.javascriptFunctions)({
						html, name, source, data, components: components.get()
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
	ec.addTemplateFormats("jstl")
	ec.addExtension("jstl", jstlExtension);



	// HELPERS //////////////////////////////////////////////////////////////////////////
	if (opts.skipFilters === true)
		return

	if (!opts.skipFilterAttr) {
		ec.addFilter('attr', (...args) => require('clsx')(...args));
	}
}
