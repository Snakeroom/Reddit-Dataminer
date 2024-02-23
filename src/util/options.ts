import { CreateOptionCommandOpts, program } from "@caporal/core";

export const debugOpt: [string, string, CreateOptionCommandOpts] = ["--debug [debug]", "Debuggers to enable.", {
	default: "reddit-dataminer:*",
	validator: program.STRING,
}];

export interface RedditDataminerOptions {
	debug: string;
	path: string;
	banner: string[];
	hashes: string;
	filterScript: string[];
	sandbox: boolean;
	cache: boolean;
	mapIndex: number;
	mapBeforeJs: boolean;
	redditUsername: string;
	redditPassword: string;
	stopDumpingAfterFail: boolean;
}
