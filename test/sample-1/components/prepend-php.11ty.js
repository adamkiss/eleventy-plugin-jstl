module.exports = function({content, php = false}) {
	const prepend = php ? `<?php ${php.trim("\n")}?>` : '';
	return `${prepend}${content}`;
}
