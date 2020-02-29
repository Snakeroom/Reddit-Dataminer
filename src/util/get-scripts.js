const baseURL = "https://new.reddit.com";

const { log } = require("./log.js");
const filter = require("./filter.js");
const userAgent = require("./user-agent.js");

const noLoadResources = [
	"script",
	"image",
	"stylesheet",
	"font",
	"media",
];

/**
 * Gets a list of scripts to dump.
 * @param {Browser} browser The browser to fetch the page's scripts from.
 * @param {Object.<string, string>} hashes The hashes for previously-saved scripts.
 * @param {Object} sessionCookie The cookie for the Reddit session.
 * @returns {string[]} The script URLs.
 */
async function getScripts(browser, hashes, sessionCookie) {
	const page = await browser.newPage();
	await page.setUserAgent(userAgent);
	await page.setJavaScriptEnabled(false);
	page.setDefaultTimeout(0);

	if (sessionCookie) {
		page.setCookie(sessionCookie);
	}

	await page.goto(baseURL);

	log("looking for scripts with browser");

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
		const source = await page.evaluate(element => {
			return element.src;
		}, script);
		scripts.push(source);
	}

	log("found browser scripts");
	return scripts.filter(source => {
		const match = source.match(filter);
		if (match === null) return false;

		// Ignore script if it has the same hash as saved before
		if (hashes[match[1]] === match[2]) return false;
		return true;
	});
}
module.exports = getScripts;