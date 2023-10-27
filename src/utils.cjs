const {parse} = require('path')
const {stringify} = require("javascript-stringify");

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
 * Convert object [key, value] entries to string of constant declarations
 *
 * @param {array<string, any>} entries array of [key, value] pairs
 * @returns string of constant declarations
 */
function objectEntriesToString(entries) {
	return entries
		.map(([key, value]) => `const ${key} = ${stringify(value, null, null, {circular: true})};`)
		.join('\n')
}
module.exports.objectEntriesToString = objectEntriesToString

/**
 * Convert object to array of [key, value] pairs, skipping keys in skip list
 *
 * @param {Object} obj Object to convert to entries
 * @param {array} skip list of keys to skip
 * @returns array<string, any> of [key, value] pairs
 */
function filteredEntries(obj, skip = ['collection']) {
	return Object.entries(obj)
		.filter(([key]) => !skip.includes(key))
}
module.exports.filteredEntries = filteredEntries

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
