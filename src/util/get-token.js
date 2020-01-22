const got = require("got");
const FormData = require("form-data");

const userAgent = require("./user-agent.js");

/**
 * Gets a token from a Reddit script's credentials.
 * @param {string} username The Reddit user's username.
 * @param {string} password The Reddit user's password.
 * @returns {string} The access token.
 */
async function getToken(username, password) {
	const form = new FormData();
	form.append("user", username);
	form.append("passwd", password);
	form.append("api_type", "json");

	const response = await got.post({
		body: form,
		headers: {
			"User-Agent": userAgent,
		},
		responseType: "json",
		url: "https://ssl.reddit.com/api/login",
	});

	return encodeURIComponent(response.body.json.data.cookie);
}
module.exports = getToken;