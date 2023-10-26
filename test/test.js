const {test} = require("node:test");
const assert = require("node:assert/strict");
const Eleventy = require("@11ty/eleventy");

test("async eleventyComputed", async t => {
	const elev = new Eleventy('./test/async/', './test/async/_site', {
		configPath: "./test/async/eleventy.config.js"
	});
	const results = await elev.toJSON();
	assert.equal(results.length, 2);
	results.forEach(page => {
		if (page.url === '/') {
			assert.equal(page.content, "\n<h1>Page with async data</h1>\n<p>delectus aut autem</p>\n");
		} else {
			assert.equal(page.content, "<h1>Page with async data</h1><p>delectus aut autem</p>");
		}
	});
})


test("Kitchen sync", async t => {
	const elev = new Eleventy('./test/kitchen-sync/', './test/kitchen-sync/_site', {
		configPath: "./test/kitchen-sync/eleventy.config.js"
	});
	const results = await elev.toJSON();
	console.log(results);
})
