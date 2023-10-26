class Test {
	data() {
		return {
			myName: "Zach",
			templateEngineOverride: "11ty.js,md"
		};
	}

	render(data) {
		return `# This is ${data.myName}`;
	}
}

module.exports = Test;
