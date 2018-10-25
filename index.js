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
    console.log({ code });
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

const promiseSpawn = (cmd, opts, debug = false) => new Promise((resolve) => {
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



const mvBranch = async ({ branch, projects }) => {
  const keys = Object.keys(projects);
  for (let i = 0; i < keys.length; i++) {
    const project = keys[i]
    await mvProjectBranch({
      project,
      projectBranch: projects[project]
    })
    if (project === 'jsfcore' || project === 'ws-editor-lib') {
      await mvSrc({
        project,
        projectBranch: projects[project]
      })
    }
  }
};

const mvSrc = ({ project, projectBranch }) =>
  promiseSpawn('bash', ['../mvsrc.sh', projectBranch, project]);

const mvProjectBranch = ({ project, projectBranch }) =>
  promiseSpawn('bash', ['../mvcommit.sh', projectBranch, project]);

const octopusMerge = async ({ projectNames, branch, projects }) =>
  promiseSpawn(
    'bash', [
      '../merge.sh',
      branch,
      ...projectNames.map(pn => projects[pn])
    ], true
  );

;(async () => {
  console.log('initResult');
  await initResult();
  await Promise.all(
    projectNames.map(async (projectName) => {
      const git = reps[projectName];
      await addRemote(projectName, git);
      console.log('addRemote');
      await fetch(projectName);
      console.log('fetch');
    })
  )

  console.log('getBranchesSource');
  const branchesSource = await getBranchesSource();
  console.log('groupBranches');
  const groupped = await groupBranches(branchesSource);
  // logBranchByAuthor(groupped);
  // console.log(JSON.stringify(groupped));
  const develop = pick(groupped, ['develop'])
  for (var branch in develop) {
    if (develop.hasOwnProperty(branch)) {
      console.log('mergeBranch', branch);
      await mvBranch({ branch, projects: pick(develop[branch], projectNames) })
    }
  }

  for (var branch in develop) {
    if (develop.hasOwnProperty(branch)) {
      // console.log('mergeBranch', { branch, projects: pick(develop[branch], projectNames) });
      const projects = pick(develop[branch], projectNames);
      await octopusMerge({ projectNames, branch, projects });
    }
  }

  // console.log(develop);
})()
