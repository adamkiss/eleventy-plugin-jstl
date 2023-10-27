const {describe, it} = require("node:test");
const assert = require("node:assert/strict");
const Eleventy = require("@11ty/eleventy");
describe("this in jstl.js files", async () => {
	await it('works', async () => {
		const elev = new Eleventy('./test/issues-fixes/this-in-functions.jstl.js', './test/issues-fixes/_site', {
			configPath: "./test/issues-fixes/eleventy.config.js"
		});
		const results = await elev.toJSON();
		assert.equal(results.length, 1);
		assert.equal(results[0]?.content, '<p>yes</p>')
	})
})
