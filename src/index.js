const cli = require("caporal");

const puppeteer = require("puppeteer");
const baseURL = "https://new.reddit.com/";
const filter = /https:\/\/www\.redditstatic\.com\/desktop2x\/([^.]+)\.?(.*)\.js/;

const beautify = require('js-beautify').js;

const debug = require("debug");
const log = debug("reddit-dataminer:main");

const fse = require("fs-extra");
const path = require("path");

const got = require("got");

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
		scripts.push(await page.evaluate(element => element.src, script));
	}

	return scripts.filter(source => filter.test(source));
}

async function run(args) {
	await fse.ensureDir(args.path);
	log("ensured output path exists");

	const browser = await puppeteer.launch();
	log("launched browser");

	const scripts = [...new Set((await Promise.all(places.map(place => {
		return getScripts(browser, place);
	}))).flat())];
	log("got list of scripts to dump");

	await Promise.all(scripts.map(async script => {
		const match = script.match(filter);

		const response = await got(script);
		const beautified = beautify(response.body, {
			indent_with_tabs: true,
		});
		fse.writeFile(path.resolve(args.path, "./" + match[1] + ".js"), beautified);
		log("dumped %s", match[1]);
	}));
	log("finished dumping all scripts");
	
	// Clean up
	log("cleaning up");
	await browser.close();
	return scripts;
}

const { version } = require("../package.json");
cli.version(version);

const debugOpt = ["--debug [debug]", "Debuggers to enable.", cli.STRING, "reddit-dataminer:*"];

cli
	.command("start", "Starts the script dumper.")
	.option(...debugOpt)
	.option("--path [path]", "The output path.", cli.STRING, null, true)
	.action((arguments2, options) => {
		const args = Object.assign(arguments2, options);
		debug.enable(args.debug);

		run(args);
	});

cli.parse(process.argv);