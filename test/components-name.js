const {test} = require('node:test')
const assert = require('node:assert/strict')

const ComponentManager = require('../src/ComponentManager.cjs')

test("Create component name from path", () => {
	const cm = new ComponentManager('/imaginary/components')

	assert.equal(
		cm.parsePath('/imaginary/components/ComponentName.jstl')?.component,
		'ComponentName'
	)
	assert.equal(
		cm.parsePath('/imaginary/components/component-name.jstl')?.component,
		'ComponentName'
	)
	assert.equal(
		cm.parsePath('/imaginary/components/CN.jstl')?.component,
		'CN'
	)

	assert.equal(
		cm.parsePath('/imaginary/components/ComponentName.jstl.js')?.component,
		'ComponentName'
	)
	assert.equal(
		cm.parsePath('/imaginary/components/component-name.jstl.js')?.component,
		'ComponentName'
	)
	assert.equal(
		cm.parsePath('/imaginary/components/CN.jstl.js')?.component,
		'CN'
	)

	assert.equal(
		cm.parsePath('/imaginary/components/you/really/like/deep/subcomponent.jstl.js')?.component,
		'You.Really.Like.Deep.Subcomponent'
	)
	assert.equal(
		cm.parsePath('/imaginary/components/x-subtract/x-subtractor.jstl.js')?.component,
		'XSubtract.XSubtractor'
	)
	assert.equal(
		cm.parsePath('/imaginary/components/DONT/touch/CASE.jstl.js')?.component,
		'DONT.Touch.CASE'
	)

	assert.equal(
		cm.parsePath('/imaginary/components/you/really/like/deep/subcomponent.jstl.js')?.relative,
		'you/really/like/deep'
	)
	assert.equal(
		cm.parsePath('/imaginary/components/x-subtract/x-subtractor.jstl.js')?.relative,
		'x-subtract'
	)
	assert.equal(
		cm.parsePath('/imaginary/components/DONT/touch/CASE.jstl.js')?.relative,
		'DONT/touch'
	)
})
