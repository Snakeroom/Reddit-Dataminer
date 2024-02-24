import { Literal, Node } from "acorn";

export function isLiteral(node: Node): node is Literal {
	return node.type === "Literal";
}

export function isStringLiteral(node: Node): node is Literal & { value: string } {
	return isLiteral(node) && typeof node.value === "string";
}
