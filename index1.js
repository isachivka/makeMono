const { spawn } = require('child_process');
const { flatten, groupBy, mapValues, first } = require('lodash');

const reps = require('./config');
const resultPath = './result';
const projectNames = Object.keys(reps);

const initResult = () => new Promise((resolve) => {
  const proc = spawn('bash', ['initResult.sh']);
  proc.on('close', (code) => {
    resolve();
  });
});

const addRemote = (projectName, git) => new Promise((resolve) => {
  const proc = spawn('git', ['remote', 'add', projectName, git], { cwd: resultPath });
  proc.on('close', (code) => {
    resolve();
  });
});

const fetch = (projectName) => new Promise((resolve) => {
  const proc = spawn('git', ['fetch', projectName], { cwd: resultPath });
  proc.on('close', (code) => {
    resolve();
  });
});

const getBranchesSource = () => new Promise(function(resolve) {
  const proc = spawn('git', ['branch', '--remote'], { cwd: resultPath });
  const result = [];
  proc.stdout.on('data', (data) => {
    result.push(
      data
        .toString('utf-8')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line)
    )
  });
  proc.on('close', (code) => {
    resolve(flatten(result));
  });
});

const fillGroup = develop => b => {
  const branch = { ...b };
  for (var i = 0; i < projectNames.length; i++) {
    const projectName = projectNames[i]
    if (!branch.hasOwnProperty(projectName)) {
      branch
      console.log(branch, projectName, develop);
    }
  }
  return branch;
}

const groupBranches = branches => {
  const group = mapValues(
    groupBy(branches, (e) => {
      return e.replace(/^[^\/]+\//, '');
    }),
    object => object.reduce(
      (acc, branch) => ({ ...acc, [first(branch.split('/'))]: branch, }),
      {}
    )
  )
  const filledGroups = mapValues(group, fillGroup(group.develop))
  console.log(JSON.stringify(filledGroups));
  return filledGroups
}

;(async () => {
  // await Promise.all(
  //   projectNames.map(async (projectName) => {
  //     await initResult();
  //     const git = reps[projectName];
  //     await addRemote(projectName, git);
  //     await fetch(projectName);
  //   })
  // )

  const branchesSource = await getBranchesSource();
  const groupped = groupBranches(branchesSource);
  // console.log(groupped);
})()
