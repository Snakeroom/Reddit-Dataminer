const baseURL = "https://new.reddit.com";
const filter = require("./filter.js");

/**
 * Gets a list of scripts to dump from a URI.
 * @param {Browser} browser The browser to fetch the page's scripts from.
 * @param {string} uri The URI to locate scripts on.
 * @param {Object.<string, string>} hashes The hashes for previously-saved scripts.
 * @returns {string[]} The script URLs.
 */
async function getScripts(browser, uri, hashes) {
	const page = await browser.newPage();
	await page.goto(baseURL + uri);

	const scripts = [];

	const scriptElems = await page.$$("script");
	for (const script of scriptElems) {
		scripts.push(await page.evaluate(element => element.src, script));
	}

	return scripts.filter(source => {
		const match = source.match(filter);
		if (match === null) return false;

		// Ignore script if it has the same hash as saved before
		if (hashes[match[1]] === match[2]) return false;
		return true;
	});
}
module.exports = getScripts;