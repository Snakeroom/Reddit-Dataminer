const baseURL = "https://new.reddit.com";

const { log } = require("./log.js");
const filter = require("./filter.js");

const noLoadResources = [
	"script",
	"image",
	"stylesheet",
	"font",
	"media",
];

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

	log("looking for scripts at %s", uri);

	await page.setRequestInterception(true);
	page.on("request", request => {
		if (noLoadResources.includes(request.resourceType())) {
			request.abort();
		} else {
			request.continue();
		}
	});

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