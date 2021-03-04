const debug = require("debug");
const dumping = debug("reddit-dataminer:dumping");
const hashes = debug("reddit-dataminer:hashes");
const log = debug("reddit-dataminer:main");

module.exports = {
	debug,
	dumping,
	hashes,
	log,
};