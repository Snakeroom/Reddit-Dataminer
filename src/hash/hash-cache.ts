/**
 * A map representing the last hash saved for each bundle.
 */
export abstract class HashCache {
	read(): void | Promise<void> {
		return;
	}

	write(): void | Promise<void> {
		return;
	}

	abstract isCached(name: string, hash: string): boolean;
	abstract add(name: string, hash: string): void;
}
