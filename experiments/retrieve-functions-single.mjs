import {RetrieveGlobals} from 'node-retrieve-globals'

const loaded = `
const b = 'something';
const c = 'something else';

return await html\`<div>\${children}</div>\`
`

const loopfn = (name, source) => `
	'${name}': ${source.includes('await') ? 'async ':''}function({children, ...props} = {}) {
		${source}
	},
`

const vm = new RetrieveGlobals(`return {
	${Array(300).fill(1).map((i, j) => i+j).map(i => loopfn(`fn${i}`, loaded)).join('\n')}
}`)
const render = await vm.getGlobalContext({}, {reuseGlobal: true})
console.log(render)
