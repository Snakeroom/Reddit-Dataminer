const cli = require("caporal");

const puppeteer = require("puppeteer");
const baseURL = "https://new.reddit.com";
const filter = /https:\/\/www\.redditstatic\.com\/desktop2x\/([^.]+)\.?(.*)\.js/;

const beautify = require('js-beautify').js;

const debug = require("debug");
const log = debug("reddit-dataminer:main");

const fse = require("fs-extra");
const path = require("path");

const got = require("got");

const { version } = require("../package.json");

const format = require("string-format");
const transformersGlobal = {
	VERSION: version,
};

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

async function run(args) {
	log(args)
	await fse.ensureDir(args.path);
	log("ensured output path exists");

	let hashes = await fse.readJSON(args.hashes).then(json => {
		log("loaded hashes from %s", args.hashes);
		return json;
	}).catch(() => {
		if (args.hashes) {
			log("failed to load hashes");
		}
		return {};
	});

	const browser = await puppeteer.launch();
	log("launched browser");

	const scripts = [...new Set((await Promise.all(args.places.map(place => {
		return getScripts(browser, place, hashes);
	}))).flat())];
	log("got list of scripts to dump");

	const transformersRun = {
		...transformersGlobal,
		DATE: new Date().toLocaleString("en-US"),
		SCRIPT_TOTAL: scripts.length,
	};

	await Promise.all(scripts.map(async (script, index) => {
		const match = script.match(filter);

		try {
			const response = await got(script);
			const beautified = beautify(response.body, {
				indent_with_tabs: true,
			});

			const transformersScript = {
				...transformersRun,
				CHAR_COUNT: beautified.length,
				FILE_NAME: match[1] + ".js",
				FILE_NAME_HASHED: `${match[1]}.${match[2]}.js`,
				HASH: match[2],
				LINE_COUNT: beautified.split("\n").length,
				SCRIPT_INDEX: index + 1,
				URL: script,
			};

			const header = args.banner.length > 0 ? args.banner.map(line => {
				return "// " + format(line, transformersScript);
			}).join("\n") + "\n" : "";

			await fse.ensureFile(path.resolve(args.path, "./" + match[1] + ".js"));
			await fse.writeFile(path.resolve(args.path, "./" + match[1] + ".js"), header + beautified);

			hashes[match[1]] = match[2];

			log("dumped %s", match[1]);
		} catch (error) {
			log("failed to dump %s: %o", error)
		}
	}));
	log("finished dumping all scripts");

	if (args.hashes) {
		await fse.writeJSON(args.hashes, hashes).then(written => {
			log("saved new hashes to %s", args.hashes);
			return written;
		}).catch(() => {
			log("failed to save new hashes");
		});
	}
	
	// Clean up
	log("cleaning up");
	await browser.close();
	return scripts;
}

cli.version(version);

const debugOpt = ["--debug [debug]", "Debuggers to enable.", cli.STRING, "reddit-dataminer:*"];

cli
	.command("start", "Starts the script dumper.")
	.option(...debugOpt)
	.option("--path [path]", "The output path.", cli.STRING, null, true)
	.option("--places [places...]", "The URIs to get script sources from.", cli.ARRAY, [
		"/",
		"/rpan",
		"/coins",
		"/premium",
	])
	.option("--banner [banner]", "The banner comment supporting placeholders", cli.ARRAY, [
		"{URL}",
		"Retrieved at {DATE} by Reddit Dataminer v{VERSION}",
	])
	.option("--hashes [hashes]", "A path to hashes, to prevent archiving a file if its hash is the same.", cli.STRING)
	.action((arguments2, options) => {
		const args = Object.assign(arguments2, options);
		debug.enable(args.debug);

		run(args);
	});

cli.parse(process.argv);