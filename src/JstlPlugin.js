const TemplateEngine = require("@11ty/eleventy/src/Engines/TemplateEngine");

class EleventyJstlPlugin extends TemplateEngine {
	constructor(name, dirs, config) {
		console.log(name, dirs, config)
	}

	async compile(c,p) {
		return async function(d) {
			return 'w'
		}
	}
}
