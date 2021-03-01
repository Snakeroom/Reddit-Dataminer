const got = require("got");
const esprima = require("esprima");

const { log, hashes: hashesLog } = require("./log.js");

/**
 * Gets scripts from the runtime script.
 * @param {string} url The URL of the runtime script.
 * @param {Object.<string, string>} hashes The hashes for previously-saved scripts.
 * @param {integer} mapIndex The index of the object mapping file names to hashes in the runtime script.
 */
async function getRuntimeScripts(url, hashes, mapIndex = 1) {
	log("looking for scripts with runtime script");

	// Fetch runtime script
	const response = await got(url);
	log("fetched runtime script");
	const program = response.body;

	// Parse objects from runtime script
	const objs = [];
	esprima.parse(program, {}, node => {
		if (node.type === "ObjectExpression") {
			const obj = Object.fromEntries(node.properties.map(prop => {
				const name = (prop.key.name || prop.key.value);
				const hash = prop.value.value;

				return [name, hash];
			}));
			if (Object.keys(obj).length > 10) {
				objs.push(obj);
			}
		}
	});
	const scriptObj = objs[mapIndex < 0 ? objs.length - mapIndex : mapIndex];

	log("found runtime script scripts");

	// Convert object to script array
	return Object.entries(scriptObj).filter(([name, hash]) => {
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