module.exports = async _ => {
	const __xhtm = (await import('xhtm')).default
	const __vhtml = (await import('@small-tech/hyperscript-to-html-string')).default
	return __xhtm.bind(__vhtml)
}
