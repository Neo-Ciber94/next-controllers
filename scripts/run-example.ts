/* eslint-disable no-console */
import { argv } from 'process';
import os from 'os';
import { spawn } from 'child_process';

// import('chalk').then((c) => {
//     console.log("import chalk");
//     console.log("Imported: ", c.default.red("Oh oh!!!"))
// });

const [projectName] = argv.slice(2);

if (!projectName) {
  throw new Error('Expected project name as first argument');
}

const exampleDir = `./examples/${projectName}`;
let cmd: string;

// https://github.com/nodejs/node/issues/3675#issuecomment-288578092
if (os.platform() === 'win32') {
  cmd = 'npm.cmd';
} else {
  cmd = 'npm';
}

const childProccess = spawn(cmd, ['run', 'dev'], { cwd: exampleDir, stdio: 'inherit' });

childProccess.once('spawn', () => console.log(`Running example "${projectName}"...`));
// childProccess.on('error', (err) => {
//   const message = chalk.red(`Error running example "${projectName}": ${err.message}`);
//   console.error(message);
// });

process.on('SIGINT', () => {
  console.log(`\nExited example "${projectName}"`);
  process.exit();
});
