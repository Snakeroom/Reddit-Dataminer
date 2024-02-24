import { Program } from "acorn";
import beautify from "js-beautify";
import { isIdentifierNamed } from "../node/identifier";
import { isStringLiteral } from "../node/literal";
import { dumping as log } from "./log";
import { simple as simpleWalk } from "acorn-walk";
import { toJs } from "../node/to-js";
import { transformCreateElement } from "../node/transform-create-element";

function getJsonParseBody(program: Program): unknown | null {
	const statement = program.body?.[0];
	if (statement?.type !== "ExpressionStatement") return null;

	const expression = statement.expression;
	if (expression?.type !== "AssignmentExpression") return null;

	const right = expression.right;
	if (right?.type !== "CallExpression") return null;

	const callee = right.callee;
	if (callee?.type !== "MemberExpression") return null;

	if (!isIdentifierNamed(callee.object, "JSON")) return null;
	if (!isIdentifierNamed(callee.property, "parse")) return null;

	if (right.arguments?.length !== 1) return null;

	const argument = right.arguments[0];

	if (!isStringLiteral(argument)) return null;

	return JSON.parse(argument.value);
}

export async function serializeModule(program: Program, name: string): Promise<string> {
	const jsx = name.endsWith(".jsx") || name.endsWith(".tsx");

	if (name.endsWith(".json")) {
		const jsonBody = getJsonParseBody(program);

		if (jsonBody === null) {
			log("failed to find JSON.parse body from module '%s'", name);
		} else {
			return JSON.stringify(jsonBody, null, "\t");
		}
	} else if (jsx) {
		simpleWalk(program, {
			CallExpression: node => {
				const jsxNode = transformCreateElement(node);

				if (jsxNode !== null) {
					Object.assign(node, jsxNode);
				}
			},
		});
	}

	const moduleBody = await toJs(program, jsx);

	const beautified = beautify(moduleBody, {
		e4x: jsx,
		/* eslint-disable-next-line camelcase */
		indent_with_tabs: true,
	});

	return beautified;
}
