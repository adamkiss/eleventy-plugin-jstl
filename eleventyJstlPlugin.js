module.exports = function (eleventyConfig, options = {}) {
	eleventyConfig.addTemplateFormats("jstl")
	eleventyConfig.addExtension("jstl", {
		outputFileExtension: "html",
		compileOptions: {},
		compile: async function(content, path) {
			const __xhtm = (await import('xhtm')).default
			const __vhtml = (await import('vhtml')).default
			const html = __xhtm.bind(__vhtml)

			return async data => {
				try {
					console.log(eval(`html\`${content}\``))
				} catch (error) {
					console.error(error)
				}

				return content
			}
		}
	});
}
