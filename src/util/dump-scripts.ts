import { RedditDataminerOptions } from "./options";
import beautify from "js-beautify";
import { filter } from "./filter";
import format from "string-format";
import fse from "fs-extra";
import { dumping as log } from "./log";
import path from "path";
import { uaGot } from "./got";

/**
 * Dumps a single script and saves it.
 * @param script The script to dump.
 * @param match The match of script to dump.
 * @param index The index of the script to dump.
 * @param transformersRun The run-specific transformers.
 * @param args The command-line arguments.
 * @param hashes The hashes for previously-saved scripts.
 */
async function dumpScript(script: string, match: RegExpMatchArray, index: number, transformersRun: Record<string, string>, args: RedditDataminerOptions, hashes: Record<string, string>): Promise<void> {
	const response = await uaGot(script);
	const beautified = beautify(response.body, {
		/* eslint-disable-next-line camelcase */
		indent_with_tabs: true,
	});

	/**
	 * The script-specific transformers.
	 */
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
}

/**
 * Dumps the scripts and saves them.
 * @param scripts The scripts to dump.
 * @param transformersRun The run-specific transformers.
 * @param args The command-line arguments.
 * @param hashes The hashes for previously-saved scripts.
 * @returns Whether dumping was attempted for all scripts.
 */
export default async function dumpScripts(scripts: string[], transformersRun: Record<string, string>, args: RedditDataminerOptions, hashes: Record<string, string>): Promise<boolean> {
	// Use a for-loop to allow an early return
	// This is not concurrent
	if (args.stopDumpingAfterFail) {
		let index = 0;
		for (const script of scripts) {
			const match = script.match(filter);
			try {
				await dumpScript(script, match, index, transformersRun, args, hashes);
				log("dumped %s", match[1]);
			} catch (error) {
				log("failed to dump %s: %O", script, error);
				return false;
			}
			index += 1;
		}
		return true;
	}

	await Promise.all(scripts.map(async (script, index) => {
		const match = script.match(filter);
		try {
			await dumpScript(script, match, index, transformersRun, args, hashes);
			log("dumped %s", match[1]);
		} catch (error) {
			log("failed to dump %s: %o", script, error);
		}
	}));
	return true;
}
