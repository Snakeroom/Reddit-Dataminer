import { Program } from "acorn";

interface ToJsOptions {
	handlers?: Handlers;
}

interface ToJsResult {
	value: string;
}

type ToJs = (program: Program, options: ToJsOptions) => ToJsResult;
type Handlers = Record<string, unknown>;

interface Module {
	toJs: ToJs;
	jsx: Handlers;
}

let estreeUtilToJs: Module | null = null;

export async function toJs(program: Program, jsx: boolean): Promise<string> {
	if (estreeUtilToJs === null) {
		/* eslint-disable-next-line no-eval -- CommonJS workaround */
		estreeUtilToJs = await eval("import(\"estree-util-to-js\")");
	}

	const result = estreeUtilToJs.toJs(program, {
		handlers: jsx ? estreeUtilToJs.jsx : undefined,
	});

	return result.value;
}
