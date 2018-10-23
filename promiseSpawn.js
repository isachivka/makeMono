const { spawn } = require('child_process');

const promiseSpawn = (cmd, opts, resultPath, debug = false) => new Promise((resolve) => {
  const proc = spawn(cmd, opts, { cwd: resultPath });
  if (debug) {
    console.log('promiseSpawn', cmd, opts.join(' '));
    proc.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    proc.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });
  }
  proc.on('close', (code) => {
    resolve();
  });
});

module.exports = promiseSpawn;
