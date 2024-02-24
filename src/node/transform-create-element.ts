import { CallExpression, Node } from "acorn";
import { JSXAttribute, JSXElement, Expression as JSXExpression } from "estree-jsx";
import { getStringLiteralOrIdentifier } from "./string-literal-or-identifier";
import { isIdentifierNamed } from "./identifier";
import { isStringLiteral } from "./literal";

/**
 * Returns the corresponding JSXElement AST node for a
 * CallExpression node that represents a React.createElement call.
 * @param node The CallExpression node to transform.
 */
export function transformCreateElement(node: CallExpression): JSXElement | null {
	if (node.callee.type !== "MemberExpression") return null;
	if (!isIdentifierNamed(node.callee.property, "createElement")) return null;

	const element = node.arguments[0];
	const elementName = getStringLiteralOrIdentifier(element);

	if (elementName === null) return null;

	const props = node.arguments[1];
	const attributes: JSXAttribute[] = [];

	if (props?.type === "ObjectExpression") {
		for (const property of props.properties) {
			if (property.type !== "Property") continue;

			const key = getStringLiteralOrIdentifier(property.key);

			if (key !== null) {
				attributes.push({
					name: {
						name: key,
						type: "JSXIdentifier",
					},
					type: "JSXAttribute",
					value: isStringLiteral(property.value) ? {
						type: "Literal",
						value: property.value.value,
					} : {
						expression: property.value as JSXExpression,
						type: "JSXExpressionContainer",
					},
				});
			}
		}
	}

	const childNodes: Node[] = [];

	for (let index = 2; index < node.arguments.length; index += 1) {
		const child = node.arguments[index];

		childNodes.push(child);
	}

	if (childNodes.length > 0) {
		attributes.push({
			name: {
				name: "children",
				type: "JSXIdentifier",
			},
			type: "JSXAttribute",
			value: {
				expression: {
					elements: childNodes as JSXExpression[],
					type: "ArrayExpression",
				},
				type: "JSXExpressionContainer",
			},
		});
	}

	return {
		children: [],
		closingElement: null,
		openingElement: {
			attributes,
			name: {
				name: elementName,
				type: "JSXIdentifier",
			},
			selfClosing: true,
			type: "JSXOpeningElement",
		},
		type: "JSXElement",
	};
}
