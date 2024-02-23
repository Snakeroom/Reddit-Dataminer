import { RedditDataminerOptions } from "./options";
import { ScriptInfo } from "../script-info";
import beautify from "js-beautify";
import format from "string-format";
import fse from "fs-extra";
import { dumping as log } from "./log";
import { uaGot } from "./got";

/**
 * Dumps a single script and saves it.
 * @param script The script to dump.
 * @param transformersRun The run-specific transformers.
 * @param args The command-line arguments.
 * @param hashes The hashes for previously-saved scripts.
 */
async function dumpScript(script: ScriptInfo, transformersRun: Record<string, string>, args: RedditDataminerOptions, hashes: Record<string, string>): Promise<void> {
	const url = script.getUrl();
	const index = script.getIndex();

	const response = await uaGot(url);
	const beautified = beautify(response.body, {
		/* eslint-disable-next-line camelcase */
		indent_with_tabs: true,
	});

	const name = script.getName();
	const hash = script.getHash();

	/**
	 * The script-specific transformers.
	 */
	const transformersScript = {
		...transformersRun,
		CHAR_COUNT: beautified.length,
		FILE_NAME: name + ".js",
		FILE_NAME_HASHED: `${name}.${hash}.js`,
		HASH: hash,
		LINE_COUNT: beautified.split("\n").length,
		SCRIPT_INDEX: index + 1,
		URL: url,
	};

	const header = args.banner.length > 0 ? args.banner.map(line => {
		return "// " + format(line, transformersScript);
	}).join("\n") + "\n" : "";

	const path = script.getPath(args.path);

	await fse.ensureFile(path);
	await fse.writeFile(path, header + beautified);

	hashes[name] = hash;
}

/**
 * Dumps the scripts and saves them.
 * @param scriptUrls The URLs of scripts to dump.
 * @param transformersRun The run-specific transformers.
 * @param args The command-line arguments.
 * @param hashes The hashes for previously-saved scripts.
 * @returns Whether dumping was attempted for all scripts.
 */
export default async function dumpScripts(scriptUrls: string[], transformersRun: Record<string, string>, args: RedditDataminerOptions, hashes: Record<string, string>): Promise<boolean> {
	const scriptInfos = scriptUrls.map((url, index) => {
		return new ScriptInfo(url, index);
	}).filter(script => {
		return args.filterScript.length === 0 || args.filterScript.includes(script.getName());
	});

	// Use a for-loop to allow an early return
	// This is not concurrent
	if (args.stopDumpingAfterFail) {
		for (const script of scriptInfos) {
			try {
				await dumpScript(script, transformersRun, args, hashes);
				log("dumped %s", script.getName());
			} catch (error) {
				log("failed to dump %s: %O", script, error);
				return false;
			}
		}
		return true;
	}

	await Promise.all(scriptInfos.map(async script => {
		try {
			await dumpScript(script, transformersRun, args, hashes);
			log("dumped %s", script.getName());
		} catch (error) {
			log("failed to dump %s: %o", script, error);
		}
	}));
	return true;
}
