let attr = {
	...props,
	'data-page-title': title,
	'data-array': ['one', 'two'],
	'classList': {one: true, two: false},
}

let maybe = "x"

return html`
	<article ...${attr} data-test="one ${maybe} two" one=${true} two=${false}>${children}</article>
`
