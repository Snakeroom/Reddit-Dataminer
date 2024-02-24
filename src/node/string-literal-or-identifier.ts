import { Node } from "acorn";
import { isIdentifier } from "./identifier";
import { isStringLiteral } from "./literal";

export function getStringLiteralOrIdentifier(node: Node): string | null {
	if (isStringLiteral(node)) {
		return node.value;
	} else if (isIdentifier(node)) {
		return node.name;
	}

	return null;
}
