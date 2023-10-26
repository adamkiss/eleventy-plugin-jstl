module.exports = html => ({children, ...props}) => {

	return html`<article ...${props}>${children}</article>`
}
