import { filter } from "./util/filter";

export class ScriptInfo {
	private readonly url: string;
	private readonly index: number;

	private readonly name: string;
	private readonly hash: string;

	constructor(url: string, index: number) {
		this.url = url;
		this.index = index;

		const match = this.url.match(filter);

		this.name = match[1];
		this.hash = match[2];
	}

	getUrl(): string {
		return this.url;
	}

	getIndex(): number {
		return this.index;
	}

	getName(): string {
		return this.name;
	}

	getHash() {
		return this.hash;
	}
}
