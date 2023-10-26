const EleventyJstlPlugin = require("../../eleventyJstlPlugin.js");

module.exports = function (eleventyConfig) {
	eleventyConfig.addPlugin(EleventyJstlPlugin);

	return {
		dir: {
			includes: "components",
			layouts: "components",
		}
	}
}
