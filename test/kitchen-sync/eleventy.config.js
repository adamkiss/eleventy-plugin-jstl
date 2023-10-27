const EleventyJstlPlugin = require("../../eleventy-plugin-jstl.cjs");

module.exports = function (eleventyConfig) {
	eleventyConfig.addPlugin(EleventyJstlPlugin);

	return {
		dir: {
			data: "data",
			includes: "components",
			layouts: "layouts",
		}
	}
}
