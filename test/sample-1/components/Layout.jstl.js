module.exports = html => function({children, ...props}) {
	return html`
		<main ...${props}>${children}</main>
	`
}

