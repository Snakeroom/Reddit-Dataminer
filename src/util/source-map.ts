import { Program } from "acorn";
import { SourceMapConsumer } from "source-map";
import { isIdentifier } from "../node/identifier";
import { dumping as log } from "./log";
import { uaGot } from "./got";
import { full as walkFull } from "acorn-walk";

const SOURCE_MAP_PATTERN = /^\/\/\s*#\s*sourceMappingURL\s*=\s*(\S*)\s*$/m;

interface SourceMap {
	mappings: string;
	names: string[];
}

/**
 * Applies a source map to an entire Webpack bundle.
 * @param program The AST of the Webpack bundle.
 * @param name The name of the bundle.
 * @param body The raw contents of the Webpack bundle.
 * @returns The source map-specific transformers.
 */
export async function applySourceMap(program: Program, name: string, body: string): Promise<Record<string, string> | null> {
	const sourceMapMatch = body.match(SOURCE_MAP_PATTERN);

	if (sourceMapMatch === null) {
		log("did not find source map for bundle '%s'", name);
		return null;
	}

	const sourceMapUrl = sourceMapMatch[1];

	const sourceMapResponse = await uaGot(sourceMapUrl, {
		responseType: "json",
	});
	const sourceMapBody: SourceMap = sourceMapResponse.body as SourceMap;

	const consumer = await new SourceMapConsumer(JSON.stringify(sourceMapBody));

	walkFull(program, node => {
		if (!isIdentifier(node)) return;

		const pos = consumer.originalPositionFor({
			column: node.loc.start.column,
			line: node.loc.start.line,
		});

		if (pos.name === null) return;

		node.name = pos.name;
	});

	return {
		SOURCE_MAP_URL: sourceMapUrl,
	};
}
