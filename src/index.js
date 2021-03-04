const { program } = require("@caporal/core");
const { debug } = require("./util/log.js");

const start = require("./start.js");

const { version } = require("../package.json");
program.version(version);

/**
 * @type {[string, string, import('@caporal/core').CreateOptionCommandOpts]}
 */
const debugOpt = ["--debug [debug]", "Debuggers to enable.", {
	default: "reddit-dataminer:*",
	validator: program.STRING,
}];

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
	.option("--no-sandbox", "Whether the Puppeteer sandbox should be enabled.", {
		validator: program.BOOLEAN,
	})
	.option("--cache", "Whether the Puppeteer cache should be enabled.", {
		default: false,
		validator: program.BOOLEAN,
	})
	.option("--map-index [map-index]", "The index of the object mapping file names to hashes in the runtime script.", {
		default: 1,
		validator: program.NUMBER,
	})
	.option("--reddit-username [reddit-username]", "The Reddit user's username.", {
		validator: program.STRING,
	})
	.option("--reddit-password [reddit-password]", "The Reddit user's password.", {
		validator: program.STRING,
	})
	.action(({ options }) => {
		debug.enable(options.debug);
		start(options);
	});

program.run(process.argv.slice(2));