import xhtm from 'xhtm'
import vhtml from '@small-tech/hyperscript-to-html-string'
const html = xhtm.bind(vhtml)

const Component = async ({children, ...props}) => await Promise.resolve(html`
	<div ...${props}>${children}</div>
`)

const value = async () => await Promise.resolve(html`
	<p>hello</p>
	<p>world</p>
`)

const noComponentNoValue = html`
	<!doctype html>
	<body>
		<${Component} class="foo">
			<p>hello</p>
			<p>world</p>
		<//>
		<div>
			${value()}
		</div>
	</body>
`
const onlyValue = await html`
	<!doctype html>
	<body>
		<${await Component} class="foo">
			<p>hello</p>
			<p>world</p>
		<//>
		<div>
			${await value()}
		</div>
	</body>
`

console.log(
	onlyValue,
	noComponentNoValue
)
