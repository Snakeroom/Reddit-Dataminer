const cli = require("caporal");
const { debug } = require("./util/log.js");

const start = require("./start.js");

const { version } = require("../package.json");
cli.version(version);

const debugOpt = ["--debug [debug]", "Debuggers to enable.", cli.STRING, "reddit-dataminer:*"];

cli
	.command("start", "Starts the script dumper.")
	.option(...debugOpt)
	.option("--path [path]", "The output path.", cli.STRING, null, true)
	.option("--banner [banner]", "The banner comment supporting placeholders", cli.ARRAY, [
		"{URL}",
		"Retrieved at {DATE} by Reddit Dataminer v{VERSION}",
	])
	.option("--hashes [hashes]", "A path to hashes, to prevent archiving a file if its hash is the same.", cli.STRING)
	.option("--no-sandbox", "Whether the Puppeteer sandbox should be enabled.", cli.BOOLEAN)
	.option("--reddit-username [reddit-username]", "The Reddit user's username.", cli.STRING)
	.option("--reddit-password [reddit-password]", "The Reddit user's password.", cli.STRING)
	.action((arguments2, options) => {
		const args = Object.assign(arguments2, options);
		debug.enable(args.debug);

		start(args);
	});

cli.parse(process.argv);