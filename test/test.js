const {test} = require("node:test");
const assert = require("node:assert/strict");
const Eleventy = require("@11ty/eleventy");
const pkg = require("../package.json");
const fs = require("fs");

test("Simple page", async t => {
	const elev = new Eleventy('./test/sample-1/page.jstl', './test/sample-1/_site', {
		configPath: "./test/sample-1/eleventy.config.js"
	});
	const results = await elev.toJSON();
	console.log(results);
})
