const {objectEntriesToString, filteredEntries} = require('./utils.cjs')
const {ray} = require('node-ray')

async function asBody({
	html,
	name = "UNKNOWN",
	source = '',
	data = {},
	components = {}
}) {
	html = html
	try {
		const ___eval___component = [
			`async () => {`,
			objectEntriesToString(filteredEntries(components)),
			objectEntriesToString(filteredEntries(data, ['collection'])),
			`; return await html\`${source}\`}`
		].join('');

		return await eval(___eval___component)()
	} catch (error) {
		console.error(error)
		return `JSTL.TPL ERROR in ${name}: ${error}`
	}
}


function asFunction({
	html,
	name = "UNKNOWN",
	source = '',
	data = {},
	components = {}
} = {}) {
	html = html
	try {
		const ___eval___component = [
			objectEntriesToString(filteredEntries(components)),
			objectEntriesToString(filteredEntries(data, ['collection'])),
			`;${source.includes('await') ? 'async ': '' }({children, ...props}) => {${source}}`
		].join('');

		return eval(___eval___component)
	} catch (error) {
		console.error(error)
		return `JSTL.JS ERROR in ${name}: ${error}`
	}
}

module.exports = {
	asBody,
	asFunction,
};
