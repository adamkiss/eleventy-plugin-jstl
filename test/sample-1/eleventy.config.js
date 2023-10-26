const EleventyJstlPlugin = require("../../eleventyJstlPlugin.js");

module.exports = function (eleventyConfig) {
	eleventyConfig.addPlugin(EleventyJstlPlugin);

	return {
		dir: {
			data: "data",
			includes: "components",
			layouts: "components",
		}
	}
}
