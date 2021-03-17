import { Browser, SetCookie } from "puppeteer";
import { hashes as hashesLog, log } from "./log";

import { filter } from "./filter";
import { userAgent } from "./user-agent";

const baseURL = "https://new.reddit.com";

const noLoadResources = [
	"script",
	"image",
	"stylesheet",
	"font",
	"media",
];

/**
 * Gets a list of scripts to dump.
 * @param browser The browser to fetch the page's scripts from.
 * @param hashes The hashes for previously-saved scripts.
 * @param sessionCookie The cookie for the Reddit session.
 * @param cache Whether the browser cache should be enabled.
 * @returns The script URLs.
 */
export default async function getScripts(browser: Browser, hashes: Record<string, string>, sessionCookie: SetCookie, cache = false): Promise<string[]> {
	const page = await browser.newPage();
	await page.setUserAgent(userAgent);
	await page.setJavaScriptEnabled(false);
	await page.setCacheEnabled(cache);
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
		if (hashes[match[1]] === match[2]) {
			hashesLog("skipping %s as its hash has not changed", match[1]);
			return false;
		}

		return true;
	});
}
