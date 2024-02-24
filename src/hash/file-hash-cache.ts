import { HashCache } from "./hash-cache";
import fse from "fs-extra";
import { hashes as log } from "../util/log";
import { resolve } from "node:path";

/**
 * A hash cache that is read from and stored in a JSON file.
 */
export class FileHashCache extends HashCache {
	private readonly cache = new Map<string, string>();
	private readonly path: string;

	constructor(path: string) {
		super();

		this.path = resolve(path);
	}

	async read(): Promise<void> {
		try {
			const json: Record<string, string> = await fse.readJSON(this.path);
			log("loaded hashes from %s", this.path);

			for (const [name, hash] of Object.entries(json)) {
				this.cache.set(name, hash);
			}
		} catch (error) {
			if (error.code === "ENOENT") {
				await fse.writeJSON(this.path, {});
				log("created hashes file at %s", this.path);
			} else {
				log("failed to load hashes file at %s", this.path);
			}
		}
	}

	async write(): Promise<void> {
		try {
			await fse.writeJSON(this.path, Object.fromEntries(this.cache));
			log("saved new hashes to %s", this.path);
		} catch {
			log("failed to save new hashes");
		}
	}

	isCached(name: string, hash: string): boolean {
		if (this.cache.get(name) === hash) {
			log("skipping %s as its hash has not changed", name);
			return true;
		}

		return false;
	}

	add(name: string, hash: string): void {
		this.cache.set(name, hash);
	}
}
