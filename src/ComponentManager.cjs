const {relative} = require('path')
const {readFile} = require('fs/promises')
const {absolutePath} = require('@11ty/eleventy-utils/src/TemplatePath')
const {glob} = require('fast-glob')
const {pathParse} = require('./utils.cjs')
const {camelCase, upperFirst, default: string} = require('lodash/string')
const {set} = require('lodash/object')
const evaluate = require('./evaluate.cjs')

class ComponentManager {
	#root = null
	#components = null

	constructor(...rootParts) {
		this.root = rootParts
	}

	/**
	 * Load components asynchronously
	 */
	async load() {
		if (this.#components !== null) return

		this.#components = {}

		const files = await glob(`${this.#root}/**/*.{jstl.js,jstl}`)
		const wrapped = files.map(async file => {
			const {ext, component} = this.parsePath(file, this.#root)
			const fn = await this.createComponent(component, file, ext)
			return [component, fn]
		});

		const _ = (await Promise.all(wrapped))
			.filter(Boolean)
			.map(([component, fn]) => {
				set(this.#components, component, fn)
				return [component, fn]
			})
	}

	/**
	 * Reset components - to be called before build to not have dead code
	 * floating around
	 *
	 * @returns void
	 */
	reset() {
		this.#components = null
	}

	get() {
		return Object.entries(this.#components)
			.map(([key, value]) => `const ${key} = ${value}`)
			.join(';\n')
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
	 * @param {object} thisArg Eleventy filters to add as "this"
	 * @returns
	 */
	async createComponent(name, file, ext) {
		const source = await readFile(file, 'utf-8')
		const type = (ext === 'jstl.js') ? 'javascript' : 'text'

		// const component = await evaluate.generateFunction({
		// 	type: (ext === 'jstl.js') ? 'javascript' : 'text',
		// 	name,
		// 	source,
		// 	data
		// })

		const component = {
			text: source => `
				({children, ...props} = {}) => {return html\`${source}\`}`,
			javascript: source => `
				({children, ...props} = {}) => {${source}}`,
		}[type](source)

		return component
	}

	/**
	 * Parse path into folder, name, all extensions, relative path and component name
	 * Component name is relative path with dots instead of slashes
	 * If any part of path or name starts with lower case, _that part_ is converted to camelCase.
	 *
	 * - /ComponentName.jstl => ComponentName
	 * - /component-name.jstl => ComponentName
	 * - /CN.jstl => CN
	 * - /imaginary/componentName.jstl => Imaginary.Componentname
	 * - /imaginary/component-name.jstl => Imaginary.ComponentName
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
			.map(
				part => part.slice(0, 1) !== part.slice(0, 1).toLocaleUpperCase()
					? upperFirst(camelCase(part))
					: part
				)
			.join('.')
		return parsed
	}
}

module.exports = ComponentManager;
