// const fs = require('fs');
// const { spawn } = require('child_process');
// const { flatten, uniq, last } = require('lodash');
//
// const repositories = './repositories';
// const resultPath = './result';
//
// const getFoldersList = async (path) => new Promise(resolve => {
//   fs.readdir(path, (err, files) => {
//     resolve(
//       files
//         .map(file => `${path}/${file}`)
//         .filter(file => fs.lstatSync(file).isDirectory())
//     )
//   })
// });
//
// const getBranches = (path) => new Promise((resolve) => {
//   const proc = spawn('git', ['branch', '--remote'], { cwd: path });
//   const result = [];
//   proc.stdout.on('data', (data) => {
//     result.push(
//       data
//         .toString('utf-8')
//         .split('\n')
//         .map(branch => branch.trim().replace('origin/', ''))
//         .filter(e => !e.includes(' '))
//     )
//   });
//   proc.on('close', (code) => {
//     resolve(flatten(result));
//   });
// });
//
// const mergeBranches = branches => uniq(flatten(branches)).filter(e => e);
// const getFolderName = path => last(path.split('/'));
// const filterDevelop = branches => branches.filter(e => e === 'develop')
//
// ;(async () => {
//   const folders = await getFoldersList(repositories);
//   const branches = await Promise.all(
//     folders.map(getBranches)
//   );
//   const mergedBranches = filterDevelop(mergeBranches(branches))
//   console.log(folders.map(getFolderName), mergedBranches);
// })()
