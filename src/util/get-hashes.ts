import fse from "fs-extra";
import { hashes as hashesLog } from "./log";

/**
 * Loads or initializes the hashes file.
 * @param path The path to get the hashes file from.
 * @returns The loaded hashes for previously-saved scripts.
 */
export default function getHashes(path: string): Promise<Record<string, string>> {
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
