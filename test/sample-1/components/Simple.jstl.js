let attributes = {
	...props,
	'data-page-title': title,
	'data-array': $f.attr(['one', 'two']),
	'class': $f.attr({one: true, two: false}),
}

let maybe = "x"

return html`
	<article ...${attributes} data-test="one ${maybe} two" one=${true} two=${false}>${children}</article>
`
