const {stringify} = require("javascript-stringify");
const {objectEntriesToString, filteredEntries} = require('./utils')

function asBody(
	html,
	name = "UNKNOWN",
	source = '',
) {

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
			`;({children, ...props}) => {${source}}`
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
