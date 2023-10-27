const {describe, it} = require("node:test");
const assert = require("node:assert/strict");
const Eleventy = require("@11ty/eleventy");
const {ray} = require("node-ray");

class Results {
	constructor(obj) {
		this.results = obj
	}
	get all() {
		return this.results
	}
	find(name) {
		return this.results.find(r => r.inputPath.endsWith(name)) ?? {}
	}
	content(name) {
		return this.find(name)?.content ?? false
	}
}

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

describe("Async", async () => {
	await Promise.all([
		it('outputs eleventyComputed value', async () => {
			const elev = new Eleventy('./test/async-simple/', './test/async-simple/_site', {
				configPath: "./test/async-simple/eleventy.config.js"
			});
			const r = new Results(await elev.toJSON())

			ray().toJson(r)
			assert.equal(r.all.length, 4);
			assert.equal(r.content('index.njk')?.replace(/\n/g, ''), "<h1>Page with async data</h1><p>delectus aut autem</p>");
			assert.equal(r.content('page.jstl')?.replace(/\n/g, ''), "<h1>Page with async data</h1><p>delectus aut autem</p>");
			assert.equal(r.content('async-component.jstl'), "<h1>Uses async component</h1><p>async is magic</p>");
			assert.equal(r.content('async-component2.jstl.js'), "<h1>Uses async component</h1><p>async is magic</p>");
		})
	]);
})

describe("Suite", async t => {
	await Promise.all([
		it('compiles jstl files', async t => {
			const elev = new Eleventy('./test/kitchen-sync/', './test/kitchen-sync/_site', {
				configPath: "./test/kitchen-sync/eleventy.config.js"
			});
			const r = new Results(await elev.toJSON())

			assert.ok(r.content('component-simple.jstl')?.includes('<title>Uses simple .jstl component</title>'))
			assert.ok(r.content('component-simple.jstl')?.includes('<main>CONTENT</main>'))
			assert.ok(r.content('component-simple.jstl')?.includes('ERROR') === false)

			assert.ok(r.content('component-complex.jstl')?.includes('<title>Uses complex .jstl.js component</title>'))
			assert.ok(r.content('component-complex.jstl')?.includes('<main>CONTENT</main>'))
			assert.ok(r.content('component-complex.jstl')?.includes('ERROR') === false)

			assert.equal(r.content('data-simple.jstl'), '<p>value</p>')
		}),

		it('compiles jstl.js files', async t => {
			const elev = new Eleventy('./test/kitchen-sync/', './test/kitchen-sync/_site', {
				configPath: "./test/kitchen-sync/eleventy.config.js"
			});
			const results = await elev.toJSON();
			const r = {
				results,
				find(name) {
					return this.results.find(r => r.inputPath.endsWith(name)) ?? {}
				},
				content(name) {
					return this.find(name)?.content ?? false
				}
			}

			assert.ok(r.content('component-simple2.jstl.js')?.includes('<title>Uses simple2 .jstl.js component</title>'))
			assert.ok(r.content('component-simple2.jstl.js')?.includes('<main>CONTENT</main>'))
			assert.ok(r.content('component-simple2.jstl.js')?.includes('ERROR') === false)

			assert.ok(r.content('component-complex2.jstl.js')?.includes('<title>Uses complex2 .jstl.js component</title>'))
			assert.ok(r.content('component-complex2.jstl.js')?.includes('<main>CONTENT</main>'))
			assert.ok(r.content('component-complex2.jstl.js')?.includes('ERROR') === false)

			assert.equal(r.content('data-complex.jstl.js'), '<p>value</p>')
		}),

		it('supports layouts all the way', async t => {
			const elev = new Eleventy('./test/kitchen-sync/', './test/kitchen-sync/_site', {
				configPath: "./test/kitchen-sync/eleventy.config.js"
			});
			const results = await elev.toJSON();
			const r = {
				results,
				find(name) {
					return this.results.find(r => r.inputPath.endsWith(name)) ?? {}
				},
				content(name) {
					return this.find(name)?.content ?? false
				}
			}

			assert.equal(r.content('layouts-matrioshka.jstl'), `<?php include __DIR __ . 'hello-world.php';\n$multiline = 'not-broken';?><title>All the layouts</title><body content="string"><main><p>content</p></main></body>`);
		}),

		it('uses props from html in components and data in layouts', async t => {
			const elev = new Eleventy('./test/kitchen-sync/', './test/kitchen-sync/_site', {
				configPath: "./test/kitchen-sync/eleventy.config.js"
			});
			const results = await elev.toJSON();
			const r = {
				results,
				find(name) {
					return this.results.find(r => r.inputPath.endsWith(name)) ?? {}
				},
				content(name) {
					return this.find(name)?.content ?? false
				}
			}

			assert.equal(r.content('props.jstl'), '<body ignore="this"><main show="this">Hello</main></body>');
		}),
	])
})

