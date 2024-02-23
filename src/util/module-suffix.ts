export const DEFAULT_KEEP_MODULE_SUFFIX: string[] = [
	".js",
	".ts",

	".mjs",
	".mts",

	".cjs",
	".cts",

	".jsx",
	".tsx",
];

export function addModuleSuffix(name: string, keepModuleSuffixes: string[]): string {
	for (const suffix of keepModuleSuffixes) {
		if (name.endsWith(suffix)) {
			return name;
		}
	}

	return name + ".js";
}
