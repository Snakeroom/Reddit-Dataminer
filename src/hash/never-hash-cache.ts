import { HashCache } from "./hash-cache";
import { hashes as log } from "../util/log";

/**
 * A hash cache that does not store or check hashes.
 */
export class NeverHashCache extends HashCache {
	read(): void {
		log("not checking bundle hashes");
	}

	isCached(): boolean {
		return false;
	}

	add(): void {
		return;
	}
}
