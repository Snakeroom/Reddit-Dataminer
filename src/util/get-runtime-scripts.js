const got = require("got");
const getHashObjects = require("./get-hash-objects.js");

const { log, hashes: hashesLog } = require("./log.js");

/**
 * Gets scripts from the runtime script.
 * @param {string} url The URL of the runtime script.
 * @param {Object.<string, string>} hashes The hashes for previously-saved scripts.
 * @param {integer} mapIndex The index of the object mapping file names to hashes in the runtime script.
 * @param {boolean} mapBeforeJs Whether to filter runtime script objects by whether they are before a `".js"` string literal.
 */
async function getRuntimeScripts(url, hashes, mapIndex = 1, mapBeforeJs = true) {
	log("looking for scripts with runtime script");

	// Fetch runtime script
	const response = await got(url);
	log("fetched runtime script");

	const objects = getHashObjects(response.body, mapBeforeJs);
	log("found %d runtime script hash objects", objects.length);

	const scriptObj = objects[mapIndex < 0 ? objects.length - mapIndex : mapIndex];
	const scriptObjEntries = Object.entries(scriptObj);
	log("found %d runtime script scripts", scriptObjEntries.length);

	// Convert object to script array
	return scriptObjEntries.filter(([name, hash]) => {
		if (hashes[name] === hash) {
			hashesLog("skipping %s as its hash has not changed", name);
			return false;
		}
		return true;
	}).map(([name, hash]) => {
		return "https://www.redditstatic.com/desktop2x/" + name + "." + hash + ".js";
	});
}
module.exports = getRuntimeScripts;