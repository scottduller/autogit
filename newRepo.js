const path = require('path');
const inquirer = require('inquirer');
const fs = require('fs');
const glob = require('glob');

const git = require('simple-git')();

const newRepo = async (octokit) => {
	//create questions array, ask for name, description and visibility
	const questions = [
		{
			name: 'name',
			type: 'input',
			message: 'Enter new repo name.',
			default: path.basename(process.cwd()), //set default to basename
			validate: function (value) {
				if (value.length) {
					return true;
				} else {
					return 'Please enter a valid input.';
				}
			},
		},
		{
			name: 'description',
			type: 'input',
			message: 'Enter new repo description (optional).',
			default: null,
		},
		{
			name: 'visibility',
			type: 'input',
			message: 'Set repo to public or private?',
			choices: ['public', 'private'],
			default: 'private',
		},
	];
	//prompt the questions
	const answers = await inquirer.prompt(questions);

	//create the data argument object from user's answers
	const data = {
		name: answers.name,
		description: answers.description,
		private: answers.visibility === 'private',
	};

	try {
		//create the remote repo and return the clone_url
		const response =
			await octokit.repos.createForAuthenticatedUser(data);
		return response.data.clone_url;
	} catch (error) {
		console.log(error);
	}
};

const ignoreFiles = async () => {
	//get array of files in the project, ignore node_modules folder
	const files = glob.sync('**/*', { ignore: '**/node_modules/**' });

	//add any node_modules to gitignore by default
	const filesToIgnore = glob.sync(
		'{*/node_modules/,node_modules/}'
	);
	if (filesToIgnore.length) {
		fs.writeFileSync(
			'.gitignore',
			filesToIgnore.join('\n') + '\n'
		);
	} else {
		//if no files are chosen to be ignored, create an empty .gitignore
		fs.closeSync(fs.openSync('.gitignore', 'w'));
	}

	//create question and pass files as the choices
	const question = [
		{
			name: 'ignore',
			type: 'checkbox',
			message:
				'Select the file and/or folders you wish to ignore:',
			choices: files,
		},
	];
	//prompt the question
	const answers = await inquirer.prompt(question);

	//if user selects some files/folders, write them into .gitignore
	if (answers.ignore.length) {
		fs.writeFileSync('.gitignore', answers.ignore.join('\n'));
	}
};

const initialCommit = async (url) => {
	try {
		await git
			.init()
			.add('.gitignore')
			.add('./*')
			.commit('Initial commit')
			.addRemote('origin', url)
			.push(url, 'master', ['--set-upstream']);

		return true;
	} catch (error) {
		console.log(error);
	}
};

//final step, export function to use in index.js
module.exports = { newRepo, ignoreFiles, initialCommit };
