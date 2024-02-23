import { Program } from "acorn";
import beautify from "js-beautify";
import { dumping as log } from "./log";

function getJsonParseBody(program: Program): unknown | null {
	const statement = program.body?.[0];
	if (statement?.type !== "ExpressionStatement") return null;

	const expression = statement.expression;
	if (expression?.type !== "AssignmentExpression") return null;

	const right = expression.right;
	if (right?.type !== "CallExpression") return null;

	const callee = right.callee;
	if (callee?.type !== "MemberExpression") return null;

	if (callee.object.type !== "Identifier") return null;
	if (callee.object.name !== "JSON") return null;

	if (callee.property.type !== "Identifier") return null;
	if (callee.property.name !== "parse") return null;

	if (right.arguments?.length !== 1) return null;

	const argument = right.arguments[0];

	if (argument.type !== "Literal") return null;
	if (typeof argument.value !== "string") return null;

	return JSON.parse(argument.value);
}

type ToJs = (program: Program) => { value: string };

export function serializeModule(program: Program, name: string, toJs: ToJs): string {
	if (name.endsWith(".json")) {
		const jsonBody = getJsonParseBody(program);

		if (jsonBody === null) {
			log("failed to find JSON.parse body from module '%s'", name);
		} else {
			return JSON.stringify(jsonBody, null, "\t");
		}
	}

	const moduleBody = toJs(program).value;

	const beautified = beautify(moduleBody, {
		/* eslint-disable-next-line camelcase */
		indent_with_tabs: true,
	});

	return beautified;
}
