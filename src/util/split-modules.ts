import { ObjectExpression, Program, Property, SpreadElement } from "acorn";

import { RedditDataminerOptions } from "./options";
import { dumping as log } from "./log";

function getModuleObject(program: Program, args: RedditDataminerOptions): ObjectExpression | null {
	if (!args.splitBundles) return null;

	const statement = program.body?.[0];
	if (statement?.type !== "ExpressionStatement") return null;

	const expression = statement.expression;
	if (expression?.type !== "CallExpression") return null;

	const chunkArray = expression.arguments?.[0];
	if (chunkArray?.type !== "ArrayExpression") return null;

	const moduleObject = chunkArray.elements?.[1];
	if (moduleObject?.type !== "ObjectExpression") return null;

	return moduleObject;
}

function extractModule(property: SpreadElement | Property, program: Program, bundleName: string, modules: Map<string, Program>): void {
	if (property.type !== "Property") {
		log("property %O in bundle '%s' is not a Property node", property, bundleName);
		return;
	}

	if (property.key.type !== "Literal") {
		log("key of property %O in bundle '%s' is not a Literal node", property, bundleName);
		return;
	}

	if (property.value.type !== "FunctionExpression") {
		log("value of property %O in bundle '%s' is not a FunctionExpression node", property, bundleName);
		return;
	}

	const moduleName = property.key.value;
	const moduleBlock = property.value.body;

	if (typeof moduleName !== "string") {
		log("key of property %O in bundle '%s' does not have a string value", property, bundleName);
		return;
	}

	const moduleProgram: Program = {
		body: moduleBlock.body,
		end: moduleBlock.end,
		sourceType: program.sourceType,
		start: moduleBlock.start,
		type: "Program",
	};

	modules.set(moduleName, moduleProgram);
}

/**
 * Given a Webpack bundle AST composed of multiple modules,
 * splits each module into its own AST, keyed by the module name.
 * @param program The program representing the Webpack bundle.
 * @param bundleName The name of the bundle containing the modules.
 * @param args The command-line arguments.
 */
export function splitModules(program: Program, bundleName: string, args: RedditDataminerOptions): Map<string, Program> {
	const modules = new Map<string, Program>();
	const moduleObject = getModuleObject(program, args);

	if (moduleObject === null) {
		// Fallback: the program itself represents a module
		modules.set(bundleName + ".js", program);
	} else {
		for (const property of moduleObject.properties) {
			extractModule(property, program, bundleName, modules);
		}
	}

	return modules;
}
