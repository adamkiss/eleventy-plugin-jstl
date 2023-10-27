const {describe, it} = require("node:test");
const assert = require("node:assert/strict");
const Eleventy = require("@11ty/eleventy");

describe("Reorganisation", async () => {
	it('still runs', async () => {
		const elev = new Eleventy('./test/reorganisation/', './test/reorganisation/_site', {
			configPath: "./test/reorganisation/eleventy.config.js"
		});
		const results = await elev.toJSON();
		console.log(results)
		assert.equal(results.length, 1);
		assert.equal(results[0]?.content, '<p>Reorganisation</p>')
	})
})


describe("Async", async () => {
	await Promise.all([
		it('outputs eleventyComputed value', async () => {
			const elev = new Eleventy('./test/async-simple/', './test/async-simple/_site', {
				configPath: "./test/async-simple/eleventy.config.js"
			});
			const results = await elev.toJSON();
			assert.equal(results.length, 2);
			results.forEach(page => {
				assert.equal(page.content?.replace(/\n/g, ''), "<h1>Page with async data</h1><p>delectus aut autem</p>");
			});
		})
	]);
})

describe.skip("Suite", async () => {
	test("Kitchen sync", async t => {
		const elev = new Eleventy('./test/kitchen-sync/', './test/kitchen-sync/_site', {
			configPath: "./test/kitchen-sync/eleventy.config.js"
		});
		const results = await elev.toJSON();
		console.log(results);
	}).skip()
})

