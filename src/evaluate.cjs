const {RetrieveGlobals} = require('node-retrieve-globals')
const {objectEntriesToString, filteredEntries} = require('./utils.cjs')

// debug tools
const {ray} = require('node-ray')
const {writeFileSync} = require('fs')

async function retrieveText({
	name = "UNKNOWN",
	source = '',
	data = {},
	components = {},
	filters = {},
}) {
	try {
		const html = await (require('./html.cjs'))()
		Object.assign(html, filters)

		ray(`${components};\treturn await html\`${source}\``)

		const vm = new RetrieveGlobals(`${components};\treturn await html\`${source}\``)
		const vmdata = Object.assign({}, data, {html})
		const render = await vm.getGlobalContext(vmdata, {reuseGlobal: true})

		return render
	} catch (error) {
		console.error(error)
		return `JSTL.TPL ERROR in ${name}: ${error}`
	}
}

async function retrieveJavascript({
	name = "UNKNOWN",
	source = '',
	data = {},
	components = {},
	filters = {},
}) {
	try {
		const html = await (require('./html.cjs'))()
		Object.assign(html, filters)

		const vm = new RetrieveGlobals(`${components}; ${source}`)
		const vmdata = Object.assign({}, data, {html})
		const render = await vm.getGlobalContext(vmdata, {reuseGlobal: true})

		return render
	} catch (error) {
		console.error(error)
		return `JSTL.JS ERROR in ${name}: ${error}`
	}
}

module.exports = {
	retrieveText,
	retrieveJavascript,
};
