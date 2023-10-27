const Eleventy = require("@11ty/eleventy");
const elev = new Eleventy('./test/reorganisation/', './test/reorganisation/_site', {
	configPath: "./test/reorganisation/eleventy.config.js"
});

(async () => {
	const results = await elev.toJSON();
	console.log(results)
})();
