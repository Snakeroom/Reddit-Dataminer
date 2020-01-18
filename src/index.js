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
	.option("--places [places...]", "The URIs to get script sources from.", cli.ARRAY, [
		"/",
		"/rpan",
		"/coins",
		"/premium",
	])
	.option("--banner [banner]", "The banner comment supporting placeholders", cli.ARRAY, [
		"{URL}",
		"Retrieved at {DATE} by Reddit Dataminer v{VERSION}",
	])
	.option("--hashes [hashes]", "A path to hashes, to prevent archiving a file if its hash is the same.", cli.STRING)
	.action((arguments2, options) => {
		const args = Object.assign(arguments2, options);
		debug.enable(args.debug);

		start(args);
	});

cli.parse(process.argv);