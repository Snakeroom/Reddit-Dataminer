import { HashCache } from "../hash/hash-cache";
import getHashObjects from "./get-hash-objects";
import got from "got";
import { log } from "./log";

/**
 * Gets scripts from the runtime script.
 * @param url The URL of the runtime script.
 * @param hashes The hashes for previously-saved scripts.
 * @param mapIndex The index of the object mapping file names to hashes in the runtime script.
 * @param mapBeforeJs Whether to filter runtime script objects by whether they are before a `".js"` string literal.
 */
export default async function getRuntimeScripts(url: string, hashes: HashCache, mapIndex = 1, mapBeforeJs = true): Promise<string[]> {
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
		return !hashes.isCached(name, hash);
	}).map(([name, hash]) => {
		return "https://www.redditstatic.com/desktop2x/" + name + "." + hash + ".js";
	});
}
