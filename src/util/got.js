const got = require("got");
const userAgent = require("./user-agent.js");

const uaGot = got.extend({
	headers: {
		"User-Agent": userAgent,
	},
});
module.exports = uaGot;
