import xhtm from 'xhtm'
import vhtml from '@small-tech/hyperscript-to-html-string'
const html = xhtm.bind(vhtml)

const ref = () => 'ou yeah'
const data = {
	eleventy: {woo: 'hoo'},
	foo: 'bar',
	page: {},
	callsref: () => ref()
}
const a = data.eleventy.woo
const b = data.foo

console.log('hoo')

console.log(html`<div>${data.callsref()} ${a} ${b}</div>`)
