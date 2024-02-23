export const DEFAULT_KEEP_MODULE_SUFFIX: string[] = [
	".js",
	".ts",

	".mjs",
	".mts",

	".cjs",
	".cts",

	".jsx",
	".tsx",

	".json",
];

export function addModuleSuffix(name: string, keepModuleSuffixes: string[]): string {
	for (const suffix of keepModuleSuffixes) {
		if (name.endsWith(suffix)) {
			// Rewrite '.json' to '.json5' so that the banner can use comments
			if (suffix === ".json") {
				return name + "c";
			}

			return name;
		}
	}

	return name + ".js";
}
