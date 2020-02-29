const puppeteer = require("puppeteer");

const { log, hashes: hashesLog } = require("./util/log.js");

const fse = require("fs-extra");

const { version } = require("../package.json");

const transformersGlobal = {
	VERSION: version,
};

const getScripts = require("./util/get-scripts.js");
const getRuntimeScripts = require("./util/get-runtime-scripts.js");
const dumpScripts = require("./util/dump-scripts.js");
const getToken = require("./util/get-token.js");

/**
 * Runs the dataminer.
 * @param {Object} args The command-line arguments.
 */
async function start(args) {
	log(args);
	await fse.ensureDir(args.path);
	log("ensured output path exists");

	const hashes = await fse.readJSON(args.hashes).then(json => {
		hashesLog("loaded hashes from %s", args.hashes);
		return json;
	}).catch(() => {
		if (args.hashes) {
			hashesLog("failed to load hashes");
		}
		return {};
	});

	const browser = await puppeteer.launch({
		args: args.noSandbox ? ["--no-sandbox", "--disable-setuid-sandbox"] : [],
	});
	log("launched browser");

	const token = await getToken(args.redditUsername, args.redditPassword);
	if (token) {
		log("got reddit session token: '%s'", token);
	} else {
		log("not using a reddit session token");
	}
	const sessionCookie = {
		domain: ".reddit.com",
		name: "reddit-session",
		value: token,
	};

	const scriptsSet = new Set();

	const placeScripts = await getScripts(browser, hashes, sessionCookie);
	for (const placeScript of placeScripts) {
		scriptsSet.add(placeScript);

		if (placeScript.startsWith("https://www.redditstatic.com/desktop2x/runtime~Reddit.")) {
			const runtimeScripts = await getRuntimeScripts(placeScript, hashes);
			for (const runtimeScript of runtimeScripts) {
				scriptsSet.add(runtimeScript);
			}
		}
	}

	const scripts = [...scriptsSet];
	log("got list of scripts to dump");

	const transformersRun = {
		...transformersGlobal,
		DATE: new Date().toLocaleString("en-US"),
		SCRIPT_TOTAL: scripts.length,
	};

	await dumpScripts(scripts, transformersRun, args, hashes);
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
module.exports = start;