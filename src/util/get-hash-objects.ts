import { Node } from "estree";
import { parseScript } from "esprima";

/**
 * Determines whether a given node is a potential object expression that stores hashes.
 * @param node The node.
 * @returns Whether the given node is a potential object expression that stores hashes.
 */
function isPotentialHashNode(node: Node): boolean {
	return node.type === "ObjectExpression" && node.properties.length > 10;
}

/**
 * Determines whether a given node is a `".js"` literal.
 * @param node The node.
 * @returns Whether the given node is a `".js"` literal.
 */
function isJsLiteral(node: Node): boolean {
	return node.type === "Literal" && node.value === ".js";
}

/**
 * Converts an object expression node to an object.
 * @param node The object expression node.
 * @returns The converted object.
 */
function convertObjectExpressionToObject(node: Node): Record<string, string> {
	if (node.type !== "ObjectExpression") {
		throw new TypeError("`node` parameter must be an object expression node");
	}

	const object: Record<string, string> = {};
	for (const property of node.properties) {
		if (property.type === "Property") {
			const key = property.key as unknown as Record<string, string>;
			const value = property.value as unknown as Record<string, string>;

			object[key.name || key.value] = value.value;
		}
	}
	return object;
}

/**
 * Parses a program and returns potential objects that store hashes.
 * @param program The program to parse in order to find object expression nodes.
 * @param beforeJs Whether to only include the first object expression node preceeding a `".js"` literal, if present.
 */
export default function getHashObjects(program: string, beforeJs = false): Record<string, string>[] {
	const nodes: Node[] = [];
	parseScript(program, {}, node => {
		nodes.push(node);
	});

	const objects = [];
	for (const node of nodes) {
		if (isPotentialHashNode(node)) {
			objects.push(convertObjectExpressionToObject(node));
		} else if (beforeJs && isJsLiteral(node) && objects.length > 0) {
			return [
				objects.at(-1),
			];
		}
	}
	return objects;
}
