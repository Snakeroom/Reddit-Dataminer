import { dumping as dumpingLog, log } from "./util/log";
import puppeteer, { SetCookie } from "puppeteer";

import { FileHashCache } from "./hash/file-hash-cache";
import { NeverHashCache } from "./hash/never-hash-cache";
import { RedditDataminerOptions } from "./util/options";
import dumpScripts from "./util/dump-scripts";
import fse from "fs-extra";
import getRuntimeScripts from "./util/get-runtime-scripts";
import getScripts from "./util/get-scripts";
import getToken from "./util/get-token";
import { version } from "./util/version";

const transformersGlobal = {
	VERSION: version,
};

/**
 * Arguments to be passed to Puppeteer if the sandbox option is disabled.
 */
const noSandboxArgs = [
	"--no-sandbox",
	"--disable-setuid-sandbox",
];

/**
 * Runs the dataminer.
 * @param args The command-line arguments.
 */
export default async function start(args: RedditDataminerOptions): Promise<string[]> {
	log(args);
	await fse.ensureDir(args.path);
	log("ensured output path exists");

	const hashes = args.hashes ? new FileHashCache(args.hashes) : new NeverHashCache();
	await hashes.read();

	const browser = await puppeteer.launch({
		args: args.sandbox ? [] : noSandboxArgs,
	});
	log("launched browser");

	const token = await getToken(args.redditUsername, args.redditPassword);
	if (token) {
		log("got reddit session token: '%s'", token);
	} else {
		log("not using a reddit session token");
	}
	const sessionCookie: SetCookie = {
		domain: ".reddit.com",
		name: "reddit-session",
		value: token,
	};

	const scriptsSet: Set<string> = new Set();

	const placeScripts = [
		...await getScripts(browser, hashes, sessionCookie, args.cache),
		...args.includeScriptUrl.map(url => url + ""),
	];

	for (const placeScript of placeScripts) {
		scriptsSet.add(placeScript);

		if (placeScript.startsWith("https://www.redditstatic.com/desktop2x/runtime~Reddit.")) {
			const runtimeScripts = await getRuntimeScripts(placeScript, hashes, args.mapIndex, args.mapBeforeJs);
			for (const runtimeScript of runtimeScripts) {
				scriptsSet.add(runtimeScript);
			}
		}
	}

	const scripts = [...scriptsSet];
	log("got list of scripts to dump");

	const transformersRun: Record<string, string> = {
		...transformersGlobal,
		DATE: new Date().toLocaleString("en-US"),
		SCRIPT_TOTAL: scripts.length + "",
	};

	if (await dumpScripts(scripts, transformersRun, args, hashes)) {
		dumpingLog("finished dumping all scripts");
	} else {
		dumpingLog("failed to dump all scripts");
	}

	await hashes.write();

	// Clean up
	log("cleaning up");
	await browser.close();
	return scripts;
}
