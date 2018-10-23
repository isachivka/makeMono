const { spawn } = require('child_process');
const {
  flatten,
  groupBy,
  mapValues,
  first,
  pickBy,
  pick,
} = require('lodash');

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

const releasesRegExp = /^releases\//;
const releasesReqProjects = ['jsfcore', 'jsfiller3', 'ws-editor-lib'];

const trueregexp = /^trueed/i;

const fillGroup = develop => (b, k) => {
  const branch = { ...b };
  for (let i = 0; i < projectNames.length; i++) {
    const projectName = projectNames[i]

    // filter trueedit branches
    if (trueregexp.test(k)) {
      return null
    }

    // filter inconsistent releases branches
    if (releasesRegExp.test(k)) {
      for (let a = 0; a < releasesReqProjects.length; a++) {
        const reqProject = releasesReqProjects[a];
        if (!branch.hasOwnProperty(reqProject)) {
          return null;
        }
      }
    }
    if (!branch.hasOwnProperty(projectName)) {
      branch[projectName] = develop[projectName];
    }
  }
  return branch;
}

const omitEmptyGroups = (groups) => {
  return pickBy(groups, e => e)
}

const groupBranches = async (branches) => {
  const group = mapValues(
    groupBy(branches, (e) => {
      return e.replace(/^[^\/]+\//, '');
    }),
    object => object.reduce(
      (acc, branch) => ({ ...acc, [first(branch.split('/'))]: branch, }),
      {}
    )
  )

  const withAuth = await appendAuthors(group);

  const filledGroups = omitEmptyGroups(
    mapValues(
      withAuth,
      fillGroup(withAuth.develop)
    )
  );
  return filledGroups
};

const promiseSpawn = (...args) => new Promise((resolve) => {
  const proc = spawn(...args, { cwd: resultPath });
  proc.on('close', (code) => {
    resolve();
  });
});

const getAuthor = (branchName, orBranchName) => new Promise((resolve) => {
  const proc = spawn('git', ['log', branchName, '-n', 1, '--pretty="%aE"'], { cwd: resultPath });
  const result = [];
  proc.stdout.on('data', (data) => {
    result.push(
      data
        .toString('utf-8')
    )
  });
  proc.on('close', (code) => {
    resolve({ authors: flatten(result), orBranchName });
  });
});

const getAuthors = (projects, branchName) => Promise.all(
  Object.keys(projects).map((key) => getAuthor(projects[key], branchName)),
);

const appendAuthors = async (groups) => {
  return new Promise(async (resolve) => {
    let authors = []
    const keys = Object.keys(groups);
    for (var i = 0; i < keys.length; i++) {
      const branchName = keys[i]
      const projects = groups[branchName];

      authors.push(await getAuthors(projects, branchName));
    }
    authors = mapValues(
      groupBy(
        flatten(authors),
        auth => auth.orBranchName,
      ),
      (arr) => (flatten([ arr.map(a => a.authors) ]))
    )

    grWithAuth = mapValues(groups, (val, key) => ({
      ...val,
      authors: flatten(authors[key]),
    }));

    // console.log(JSON.stringify({ grWithAuth }));
    resolve(grWithAuth);
  });
}

const logBranchByAuthor = groupped => {
  console.log(
    Object.keys(groupped).reduce((acc, branch) => {
      const obj = groupped[branch];
      for (var i = 0; i < obj.authors.length; i++) {
        const author = obj.authors[i];
        if (acc[author]) {
          acc[author].push(branch)
        } else {
          acc[author] = [branch];
        }
      }
      return acc;
    }, {})
  );
};

mergeProjectBranch = ({ project, branch, projectBranch }) => new Promise((resolve) => {
  console.log({ project, branch, projectBranch });
  promiseSpawn('git', ['checkout', projectBranch])
  resolve();
});

const mergeBranch = ({ branch, projects }) => Promise.all(
  Object
    .keys(projects)
    .map(
      (project) => mergeProjectBranch({
        project,
        branch,
        projectBranch: projects[project]
      })
    )
);

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
  const groupped = await groupBranches(branchesSource);
  // logBranchByAuthor(groupped);
  const develop = pick(groupped, ['develop'])
  for (var branch in develop) {
    if (develop.hasOwnProperty(branch)) {
      await mergeBranch({ branch, projects: pick(develop[branch], projectNames) })
    }
  }
  // console.log(develop);
})()
