const app = require('commander');
const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const inquirer = require('inquirer');

const auth = require('./creds');
const repo = require('./newRepo');

app.command('init')
	.description('Run CLI tool')
	.action(async () => {
		clear(); //clears the terminal

		//display app title
		console.log(
			chalk.yellowBright(
				figlet.textSync('AutoGit', {
					horizontalLayout: 'full',
				})
			)
		);

		//show welcome message
		console.log('Welcome to the GitHub initializer tool.');

		const question = [
			{
				name: 'proceed',
				type: 'input',
				message:
					'Proceed to push this project to a Github remote repo?',
				choices: ['y', 'N'],
				default: 'y',
			},
		];
		const answer = await inquirer.prompt(question);

		if (answer.proceed == 'y') {
			//proceed with Github authentication, creating the repo, etc.
			console.log(chalk.gray('Authenticating...'));
			const octokit = await auth.authenticate();
			console.log(
				chalk.gray('Initializing new remote repo...')
			);
			const url = await repo.newRepo(octokit);

			console.log(
				chalk.gray(
					'Remote repo created. Choose files to ignore.'
				)
			);
			await repo.ignoreFiles();

			console.log(
				chalk.gray(
					'Committing files to GitHub at: ' +
						chalk.yellow(url)
				)
			);
			const commit = await repo.initialCommit(url);
			if (commit) {
				console.log(
					chalk.green(
						'Your project has been successfully committed to Github!'
					)
				);
			}
		} else {
			//show exit message
			console.log(chalk.gray('Okay, bye.'));
		}
	});

app.parse(process.argv); //get the arg (i.e. init)

//show help if no arg is passed
if (!app.args.length) {
	app.help();
}
