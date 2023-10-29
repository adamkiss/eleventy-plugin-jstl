module.exports = async _ => {
	const __xhtm = (await import('./xhtm.mjs')).default
	const __vhtml = (await import('./vhtml.mjs')).default
	return __xhtm.bind(__vhtml)
}
