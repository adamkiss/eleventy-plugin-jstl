import {RetrieveGlobals} from 'node-retrieve-globals'
import xhtm from 'xhtm'
import vhtml from '@small-tech/hyperscript-to-html-string'
const html = xhtm.bind(vhtml)

const code = `
const a = eleventy.woo
const b = foo

console.log('hoo')

return html\`<div>\${callsref()} \${a} \${b}</div>\`
`
const ref = () => 'ou yeah'
const data = {
	eleventy: {woo: 'hoo'},
	foo: 'bar',
	page: {},
	callsref: () => ref(),
	html
}
const ctx = new RetrieveGlobals(code)
const result = await ctx.getGlobalContext(data, {reuseGlobal: true})
console.log(result)
