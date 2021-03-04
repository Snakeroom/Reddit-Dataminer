const { dumping: log } = require("./log.js");
const filter = require("./filter.js");
const got = require("./got.js");

const format = require("string-format");
const beautify = require("js-beautify").js;

const path = require("path");
const fse = require("fs-extra");

/**
 * Dumps the scripts and saves them.
 * @param {string[]} scripts The scripts to dump.
 * @param {Object} transformersRun The run-specific transformers.
 * @param {Object} args The command-line arguments.
 * @param {Object.<string, string>} hashes The hashes for previously-saved scripts.
 * @returns {Promise<boolean>} Whether dumping was attempted for all scripts.
 */
async function dumpScripts(scripts, transformersRun, args, hashes) {
	let index = 0;
	for (const script of scripts) {
		const match = script.match(filter);

		try {
			const response = await got(script);
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

			log("dumped %s", match[1]);
		} catch (error) {
			log("failed to dump %s: %O", script, error);
			if (args.stopDumpingAfterFail) {
				return false;
			}
		}

		index += 1;
	}
	return true;
}
module.exports = dumpScripts;