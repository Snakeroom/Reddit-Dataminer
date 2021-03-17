import got from "got";
import { userAgent } from "./user-agent";

export const uaGot = got.extend({
	headers: {
		"User-Agent": userAgent,
	},
});
