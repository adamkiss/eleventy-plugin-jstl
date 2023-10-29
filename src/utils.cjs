const {parse} = require('path')

/**
 * Get the directory, name and all extensions (without leading dot) of a path
 *
 * @param {string} path
 * @returns object {dir, name, ext}
 */
function pathParse(path) {
	const {dir, base} = parse(path)
	const [name, ...ext] = base.split('.')

	return {dir, name, ext: ext.join('.')}
}
module.exports.pathParse = pathParse

/**
 * Convert eleventy data into object ready to be passed to a file/component
 *
 * @param {Object} data eleventy data object
 * @returns object
 */
function eleventyDataForPage(data, {keyForAllData = '$data'} = {}) {
	const {collections, eleventy, ...rest} = data
	return {
		eleventy,
		[keyForAllData]: {...rest},
		...rest,
	}
}
module.exports.eleventyDataForPage = eleventyDataForPage
