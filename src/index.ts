import { RedditDataminerOptions, debugOpt } from "./util/options";

import debug from "debug";
import { program } from "@caporal/core";
import start from "./start";
import { version } from "./util/version";

program.version(version);

program
	.command("start", "Starts the script dumper.")
	.option(...debugOpt)
	.option("--path [path]", "The output path.", {
		required: true,
		validator: program.STRING,
	})
	.option("--banner [banner]", "The banner comment supporting placeholders", {
		default: [
			"{URL}",
			"Retrieved at {DATE} by Reddit Dataminer v{VERSION}",
		],
		validator: program.ARRAY,
	})
	.option("--hashes [hashes]", "A path to hashes, to prevent archiving a file if its hash is the same.", {
		validator: program.STRING,
	})
	.option("--filter-script [script...]", "If provided, restricts archival to only the script names specified.", {
		default: [],
		validator: program.ARRAY,
	})
	.option("--sandbox", "Whether the Puppeteer sandbox should be enabled.", {
		default: true,
		validator: program.BOOLEAN,
	})
	.option("--cache", "Whether the Puppeteer cache should be enabled.", {
		default: false,
		validator: program.BOOLEAN,
	})
	.option("--map-index [map-index]", "The index of the object mapping file names to hashes in the runtime script.", {
		default: 0,
		validator: program.NUMBER,
	})
	.option("--map-before-js", "Whether to filter runtime script objects by whether they are before a \".js\" string literal.", {
		default: true,
		validator: program.BOOLEAN,
	})
	.option("--reddit-username [reddit-username]", "The Reddit user's username.", {
		validator: program.STRING,
	})
	.option("--reddit-password [reddit-password]", "The Reddit user's password.", {
		validator: program.STRING,
	})
	.option("--stop-dumping-after-fail", "Whether to stop dumping once a single file fails to be dumped.", {
		default: false,
		validator: program.BOOLEAN,
	})
	.action(params => {
		const options = params.options as unknown as RedditDataminerOptions;

		debug.enable(options.debug);
		start(options);
	});

program.run(process.argv.slice(2));
