const puppeteer = require("puppeteer");
const baseURL = "https://new.reddit.com/";
const filter = /https:\/\/www\.redditstatic\.com\/desktop2x\/.+\.js/;

const places = [
	null,
	"rpan",
];

async function getScripts(browser, uri) {
	const page = await browser.newPage();
	await page.goto(uri ? baseURL + uri : baseURL);

	const scripts = [];

	const scriptElems = await page.$$("script");
	for (const script of scriptElems) {
		scripts.push(await page.evaluate(el => el.src, script));
	}

	return scripts.filter(source => filter.test(source));
}

async function run() {
	const browser = await puppeteer.launch();

	const scripts = [...new Set((await Promise.all(places.map(place => {
		return getScripts(browser, place);
	}))).flat())];
	
	// Clean up
	await browser.close();
	return scripts;
}
run().then(result => console.log(result));
