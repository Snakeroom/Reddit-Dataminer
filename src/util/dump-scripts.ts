import { HashCache } from "../hash/hash-cache";
import { RedditDataminerOptions } from "./options";
import { ScriptInfo } from "../script-info";
import { addModuleSuffix } from "./module-suffix";
import { applySourceMap } from "./source-map";
import format from "string-format";
import fse from "fs-extra";
import isPathInside from "is-path-inside";
import { dumping as log } from "./log";
import { parse } from "acorn";
import { resolve } from "node:path";
import { serializeModule } from "./serialize-module";
import { splitModules } from "./split-modules";
import { uaGot } from "./got";

/**
 * Dumps a single script and saves it.
 * @param script The script to dump.
 * @param transformersRun The run-specific transformers.
 * @param args The command-line arguments.
 * @param hashes The hashes for previously-saved scripts.
 * @param knownModules The modules that have already been archived.
 * @returns The number of modules archived.
 */
async function dumpScript(script: ScriptInfo, transformersRun: Record<string, string>, args: RedditDataminerOptions, hashes: HashCache, knownModules: Set<string>): Promise<number> {
	const url = script.getUrl();
	const index = script.getIndex();

	const response = await uaGot(url);

	const program = parse(response.body, {
		ecmaVersion: "latest",
		locations: true,
	});

	const name = script.getName();
	const hash = script.getHash();

	const transformersSourceMap = await applySourceMap(program, name, response.body);
	const modules = splitModules(program, name, args);

	/**
	 * The script-specific transformers.
	 */
	const transformersScript = {
		...transformersRun,
		...transformersSourceMap,
		FILE_NAME: name + ".js",
		FILE_NAME_HASHED: `${name}.${hash}.js`,
		HASH: hash,
		MODULE_COUNT: modules.size,
		SCRIPT_INDEX: index + 1,
		URL: url,
	};

	let moduleIndex = 0;

	for (const [moduleName, moduleNode] of modules) {
		if (!knownModules.has(moduleName)) {
			const path = resolve(args.path, "./" + addModuleSuffix(moduleName, args.keepModuleSuffix));

			if (isPathInside(path, args.path)) {
				const serialized = await serializeModule(moduleNode, moduleName);

				/**
				 * The module-specific transformers.
				 */
				const transformersModule = {
					...transformersScript,
					CHAR_COUNT: serialized.length,
					LINE_COUNT: serialized.split("\n").length,
					MODULE_INDEX: moduleIndex + 1,
					MODULE_NAME: moduleName,
				};

				const header = args.banner.length > 0 ? args.banner.map(line => {
					return "// " + format(line, transformersModule);
				}).join("\n") + "\n" : "";

				await fse.ensureFile(path);
				await fse.writeFile(path, header + serialized);

				knownModules.add(moduleName);
			} else {
				log("module %s in bundle '%s' is outside the output directory", moduleName, name);
			}
		}

		moduleIndex += 1;
	}

	hashes.add(name, hash);
	return modules.size;
}

/**
 * Dumps the scripts and saves them.
 * @param scriptUrls The URLs of scripts to dump.
 * @param transformersRun The run-specific transformers.
 * @param args The command-line arguments.
 * @param hashes The hashes for previously-saved scripts.
 * @returns Whether dumping was attempted for all scripts.
 */
export default async function dumpScripts(scriptUrls: string[], transformersRun: Record<string, string>, args: RedditDataminerOptions, hashes: HashCache): Promise<boolean> {
	const scriptInfos = scriptUrls.map((url, index) => {
		return new ScriptInfo(url, index);
	}).filter(script => {
		return args.filterScript.length === 0 || args.filterScript.includes(script.getName());
	});

	const knownModules = new Set<string>();

	// Use a for-loop to allow an early return
	// This is not concurrent
	if (args.stopDumpingAfterFail) {
		for (const script of scriptInfos) {
			try {
				const moduleCount = await dumpScript(script, transformersRun, args, hashes, knownModules);
				log("dumped %s with %d modules", script.getName(), moduleCount);
			} catch (error) {
				log("failed to dump %s: %O", script, error);
				return false;
			}
		}
		return true;
	}

	await Promise.all(scriptInfos.map(async script => {
		try {
			const moduleCount = await dumpScript(script, transformersRun, args, hashes, knownModules);
			log("dumped %s with %d modules", script.getName(), moduleCount);
		} catch (error) {
			log("failed to dump %s: %o", script, error);
		}
	}));
	return true;
}
