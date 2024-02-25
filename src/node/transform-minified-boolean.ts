import { Literal, UnaryExpression } from "acorn";
import { isLiteral } from "./literal";

function createBooleanLiteral(value: boolean): Literal {
	return {
		end: -1,
		start: -1,
		type: "Literal",
		value,
	};
}

/**
 * Returns the corresponding Literal representing a boolean
 * for a UnaryExpression node that represents '!0' or '!1'.
 * @param node The UnaryExpression node to transform.
 */
export function transformMinifiedBoolean(node: UnaryExpression): Literal | null {
	if (node.operator === "!" && isLiteral(node.argument)) {
		if (node.argument.value === 0) {
			return createBooleanLiteral(true);
		} else if (node.argument.value === 1) {
			return createBooleanLiteral(false);
		}

		return null;
	}
}
