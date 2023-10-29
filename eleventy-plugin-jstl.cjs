// const { TemplatePath } = require("@11ty/eleventy-utils");
const {readFile} = require('node:fs/promises')
const matter = require('gray-matter')

const loadHtmlTag = require('./src/html.cjs')
const ComponentManager = require('./src/ComponentManager.cjs')
const evaluate = require('./src/evaluate.cjs')
const {eleventyDataForPage} = require('./src/utils.cjs')

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

		// add filters to evaluate context, because `asFunction` is an arrow function
		Object.assign(evaluate, ec.javascriptFunctions)
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
				})

				try {
					// if data.content exists, it means we are in a layout call
					// from eleventy, so we convert the "content"
					// into hyperscript children array
					// if data.props exist, we're intentional about passing props
					functionArgs = Object.assign(
						{},
						{children: ('content' in data) ? [data.content] : []},
						data.props ?? {}
					)
					let result = await pageFunction(functionArgs)

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
					let bodyFn = evaluate.asBody.bind(ec.javascriptFunctions)({
						html, name, source, data, components: components.get()
					})
					let result = await bodyFn()

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
