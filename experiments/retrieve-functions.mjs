import {RetrieveGlobals} from 'node-retrieve-globals'

const loaded = `
const b = 'something';
const c = 'something else';

return await html\`<div>\${children}</div>\`
`

const code = source => `
return ${source.includes('await') ? 'async ':''}function({children, ...props} = {}) {
	${source}
}
`

const fns = await Promise.all([Array(300).fill(true).map(async () => {
	const vm = new RetrieveGlobals(code(loaded))
	const render = await vm.getGlobalContext({}, {reuseGlobal: true})
	return render
})])

console.log('done', fns)
