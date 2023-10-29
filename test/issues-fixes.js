const {describe, it} = require("node:test");
const assert = require("node:assert/strict");
const Eleventy = require("@11ty/eleventy");

describe("Fixes", async t => {
	await it('this in functions', async () => {
		const elev = new Eleventy('./test/issues-fixes/component-as-fn.jstl.js', './test/issues-fixes/_site', {
			configPath: "./test/issues-fixes/eleventy.config.js"
		});
		const results = await elev.toJSON();
		assert.equal(results.length, 1);
		assert.equal(results[0]?.content, '<p>yes</p>')
	})

	await it('using Component as Function', async () => {
		const elev = new Eleventy('./test/issues-fixes/component-as-fn.jstl', './test/issues-fixes/_site', {
			configPath: "./test/issues-fixes/eleventy.config.js"
		});
		const results = await elev.toJSON();
		assert.equal(results.length, 1);
		assert.equal(results[0]?.content, '<p>yes</p>')
	})
})
