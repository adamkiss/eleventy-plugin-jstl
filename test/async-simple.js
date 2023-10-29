const {describe, it} = require("node:test");
const assert = require("node:assert/strict");
const Eleventy = require("@11ty/eleventy");
const Results = require("./_helpers/Results")
const {ray} = require("node-ray");

describe("Async", async () => {
	await Promise.all([
		it('outputs eleventyComputed value', async () => {
			const elev = new Eleventy('./test/async-simple/', './test/async-simple/_site', {
				configPath: "./test/async-simple/eleventy.config.js"
			});
			const r = new Results(await elev.toJSON());
			assert.equal(r.all.length, 5);
			assert.equal(r.content('index.njk').replace(/\n/g, ''), "<h1>Page with async data</h1><p>delectus aut autem</p>");
			assert.equal(r.content('page.jstl'), "<h1>Page with async data</h1><p>delectus aut autem</p>");
			assert.equal(r.content('async-data-hack.jstl'), "<h1>Page with async data</h1><p>async</p>");
			assert.equal(r.content('async-data-fn.jstl.js'), "<h1>Page with async data</h1><p>async</p>");
			assert.equal(r.content('async-data-fn2.jstl'), "<h1>Page with async data</h1><p>async</p>");
		})
	]);
})
