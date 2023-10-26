const javascriptStringify = require("javascript-stringify");
const TemplateEngine = require("@11ty/eleventy/src/Engines/TemplateEngine");
const EleventyBaseError = require("@11ty/eleventy/src/EleventyBaseError");

class JavaScriptTemplateLiteralCompileError extends EleventyBaseError {}

function normalizeTicks(str) {
	// TODO make this work with tagged templates html``
	let trimmedStr = str.trim();
	if (
		trimmedStr.charAt(0) === "`" &&
		trimmedStr.charAt(trimmedStr.length - 1) === "`"
	) {
		str =
			"`" +
			trimmedStr.substr(1, trimmedStr.length - 2).replace(/`/g, "\\`") +
			"`";
	} else {
		str =
			"`" +
			str.replace(/`/g, "\\`") +
			(trimmedStr.charAt(trimmedStr.length - 1) === "`" ? "\n" : "") +
			"`";
	}

	return str;
}

module.exports = (ec, opts = {}) => {
	ec.addTemplateFormats("jstl")
	ec.addExtension("jstl", {
		outputFileExtension: "html",
		compileOptions: {},
		async compile(str, inputPath) {
			return function(data) {
				// avoid `with`
				let dataStr = "";
				for (let j in data) {
					if (j === 'collections') continue

					dataStr += `let ${j} = ${javascriptStringify.stringify(
						data[j],
						null,
						null,
						{
							references: true
						}
					)};\n`;
				}

				let evalStr = `${dataStr}\n${normalizeTicks(
					str
				)};`;
				try {
					// TODO switch to https://www.npmjs.com/package/es6-template-strings
					let val = eval(evalStr);
					return val;
				} catch (e) {
					throw new JavaScriptTemplateLiteralCompileError(
						`Broken ES6 template:\n${evalStr}`,
						e
					);
				}
			};
		}
	})
}
