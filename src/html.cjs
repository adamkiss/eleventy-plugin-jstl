/**
 * Import -> CommonJS
 * @see https://adamcoster.com/blog/commonjs-and-esm-importexport-compatibility-examples
 */

/**
 * Import a module by `require()`ing it. If that results in
 * an error, return the error code.
 */
function requireModule(modulePath, exportName) {
	try {
		const imported = require(modulePath);
		return exportName ? imported[exportName] : imported;
	} catch (err) {
		return err.code;
	}
}

/**
 * CommonJS does not have top-level `await`, so we can wrap
 * everything in an `async` IIFE to make our lives a little easier.
 */
(async function () {

	const xhtm = (await import('xhtm')).default
	const vhtml = (await import('vhtml')).default

	module.exports = {
		xhtm,
		vhtml,
	}
})();
