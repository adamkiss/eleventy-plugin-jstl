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

module.exports = Results
