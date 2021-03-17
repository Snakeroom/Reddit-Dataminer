import got, { Response } from "got";

import FormData from "form-data";
import { userAgent } from "./user-agent";

interface LoginResponseBody {
	json: {
		data: {
			cookie: string;
		}
	}
}

/**
 * Gets a token from a Reddit script's credentials.
 * @param username The Reddit user's username.
 * @param password The Reddit user's password.
 * @returns The access token.
 */
export default async function getToken(username: string, password: string): Promise<string> {
	if (username && password) {
		const form = new FormData();
		form.append("user", username);
		form.append("passwd", password);
		form.append("api_type", "json");

		const response: Response<LoginResponseBody> = await got.post({
			body: form,
			headers: {
				"User-Agent": userAgent,
			},
			responseType: "json",
			url: "https://ssl.reddit.com/api/login",
		});

		return encodeURIComponent(response.body.json.data.cookie);
	}

	return "";
}
