import { Identifier, Node } from "acorn";

export function isIdentifier(node: Node): node is Identifier {
	return node.type === "Identifier";
}

export function isIdentifierNamed<T extends Identifier["name"]>(node: Node, name: T): node is Identifier & { name: T } {
	return isIdentifier(node) && node.name === name;
}
