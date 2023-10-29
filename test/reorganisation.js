const {describe, it} = require("node:test");
const assert = require("node:assert/strict");
const Eleventy = require("@11ty/eleventy");
const {ray} = require("node-ray");

describe("Reorganisation", async () => {
	await it('still runs', async () => {
		const elev = new Eleventy('./test/reorganisation/', './test/reorganisation/_site', {
			configPath: "./test/reorganisation/eleventy.config.js"
		});
		const results = await elev.toJSON();
		assert.equal(results.length, 1);
		assert.equal(results[0]?.content, '<p>Reorganisation</p>')
	})
})
