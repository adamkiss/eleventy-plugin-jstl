const {relative} = require('path')
const {readFile} = require('fs/promises')
const {absolutePath} = require('@11ty/eleventy-utils/src/TemplatePath')
const {glob} = require('fast-glob')
const {pathParse} = require('./utils.cjs')
const {camelCase, upperFirst} = require('lodash/string')
const {set} = require('lodash/object')
const evaluate = require('./evaluate.cjs')

class ComponentManager {
	#html = null
	#root = null
	#components = {}

	constructor(...rootParts) {
		this.root = rootParts
	}

	/**
	 * Load components asynchronously
	 *
	 * @note We must pass the html here, so we can inject it into the component functions
	 *
	 * @param {function} html tagged template function
	 */
	async load(html) {
		this.#html = html
		this.#components = {}

		const files = await glob(`${this.#root}/**/*.{jstl.js,jstl}`)
		const wrapped = files.map(async file => {
			const {ext, component} = this.parsePath(file, this.#root)
			const fn = await this.createComponent(component, file, ext)
			return [component, fn]
		});

		(await Promise.all(wrapped))
			.filter(Boolean)
			.map(([component, fn]) => {set(this.#components, component, fn)})
	}

	get() {
		return this.#components;
	}

	get root() {
		return this.#root;
	}

	set root([...paths]) {
		this.#root = absolutePath(...paths)
	}

	/**
	 * Creates a component function from a file;
	 * If the extension is '.jstl.js', only the function header is appended;
	 * If the extension is '.jstl', header and return statement are appended;
	 *
	 * @param {string} name Name of the component
	 * @param {string} file absolute path to the file
	 * @param {string} ext extension of the file
	 * @returns
	 */
	async createComponent(name, file, ext) {
		const source = await readFile(file, 'utf-8')

		const component = evaluate.asFunction({
			html: this.#html,
			name,
			source: (ext === 'jstl.js') ? source : `return html\`\n${source}\``,
		});

		return component
	}

	/**
	 * Parse path into folder, name, all extensions, relative path and component name
	 * Component name is relative path with dots, unless a part of the path is in kebab-case,
	 * in which case _that part_ is converted to camelCase.
	 *
	 * - /ComponentName.jstl => ComponentName
	 * - /component-name.jstl => ComponentName
	 * - /CN.jstl => CN
	 * - /imaginary/ComponentName.jstl => imaginary.ComponentName
	 * - /imaginary/component-name.jstl => imaginary.ComponentName
	 * - /im-aginary/CN.jstl => ImAginary/CN
	 *
	 * @param {string} path
	 * @returns object {dir, name, ext, relative, component}
	 */
	parsePath(path) {
		const parsed = pathParse(path)
		parsed.relative = relative(this.#root, parsed.dir)
		parsed.component = [...parsed.relative.split('/'), parsed.name]
			.filter(part => part && part !== '')
			.map(part => part.includes('-') ? upperFirst(camelCase(part)) : part)
			.join('.')
		return parsed
	}
}

module.exports = ComponentManager;
