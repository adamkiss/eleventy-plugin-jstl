const {describe, it} = require("node:test");
const assert = require("node:assert/strict");
const Eleventy = require("@11ty/eleventy");
describe("this in jstl.js files", async () => {
	await it('works', async () => {
		const elev = new Eleventy('./test/this-jstl-js/', './test/this-jstl-js/_site', {
			configPath: "./test/this-jstl-js/eleventy.config.js"
		});
		const results = await elev.toJSON();
		assert.equal(results.length, 1);
		assert.equal(results[0]?.content, '<p>yes</p>')
	})
})
