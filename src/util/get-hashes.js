const fse = require("fs-extra");

const { hashes: hashesLog } = require("./log.js");

/**
 * Loads or initializes the hashes file.
 * @param {string} path The path to get the hashes file from.
 * @returns {Object.<string, string>} The loaded hashes for previously-saved scripts.
 */
function getHashes(path) {
	return fse.readJSON(path).then(json => {
		hashesLog("loaded hashes from %s", path);
		return json;
	}).catch(async error => {
		if (path) {
			if (error.code === "ENOENT") {
				await fse.writeJSON(path, {});
				hashesLog("created hashes");
				return {};
			}

			hashesLog("failed to load hashes");
		}
		return {};
	});
}
module.exports = getHashes;