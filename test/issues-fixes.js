const {test} = require("node:test");
const assert = require("node:assert/strict");
const Eleventy = require("@11ty/eleventy");

const createIssuesEleventy = filename => new Eleventy(
	`./test/issues-fixes/${filename}`,
	'./test/issues-fixes/_site',
	{configPath: "./test/issues-fixes/eleventy.config.js"}
)

test("Fixes", async t => {
	const fix1 = await createIssuesEleventy('this-in-functions.jstl.js').toJSON();
	assert.equal(fix1.length, 1);
	assert.equal(fix1[0]?.content, '<p>yes</p>')

	const fix2 = await createIssuesEleventy('component-as-fn.jstl').toJSON();
	assert.equal(fix2.length, 1);
	assert.equal(fix2[0]?.content, '<p>yes</p>')
})
