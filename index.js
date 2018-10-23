const { spawn } = require('child_process');
const _ = require('lodash');
const promiseSpawn = require('./promiseSpawn');

/**
 * Путь к репозиторию
 */
const resultPath = '../result';

/**
 * Запускаем `git branch --remote`
 * читаем результаты, сплитим ответы в массив вида:
 *
 * ["jsfcore/develop", "jsfiller3/develop", "snfiller/release/1", "ws-editor-lib/release/1"]
 */
const getBranchesArray = () => new Promise((resolve) => {
  const proc = spawn('git', ['branch', '--remote'], { cwd: resultPath });
  let resultStr = '';
  proc.stdout.on('data', (data) => {
    resultStr += data.toString('utf-8');
  });

  proc.on('close', (code) => {
    resolve(_.flatten(
      resultStr
        .split('\n')
        .map(line => line.trim())
        .filter(line => line)
    ));
  });
});

/**
 * ["jsfcore/develop", "jsfiller3/develop", "snfiller/release/1", "ws-editor-lib/release/1"]
 * ->
 * {
 *   develop: ["jsfcore/develop", "jsfiller3/develop"],
 *   "release/1": ["snfiller/release/1", "ws-editor-lib/release/1"]
 * }
 */
const groupByBranchName = branches => _.groupBy(branches, e => e.replace(/^[^\/]+\//, ''));

/**
 * {
 *   develop: ["jsfcore/develop", "jsfiller3/develop"],
 *   "release/1": ["snfiller/release/1", "ws-editor-lib/release/1"]
 * }
 * ->
 * {
 *   develop: { jscore: "jsfcore/develop", jsfiller3: "jsfiller3/develop" },
 *   "release/1": { snfiller: "snfiller/release/1", "ws-editor-lib": "ws-editor-lib/release/1" }
 * }
 */
const convertToObjects = groupedBranches => _.mapValues(groupedBranches,
  o => o.reduce(
    (acc, branch) => ({ ...acc, [_.first(branch.split('/'))]: branch, }),
    {}
  ),
);

/**
 * Фильтрация невалидных релизов
 * Невалидными считаются все релизы ветки которой нет хоть в одном обязательном
 * проекте из списка ниже:
 * { 'releases/1': { jsfcore: 'jsfcore/releases/1' } }
 * ->
 * { 'releases/1': null }
 */
const releasesReqProjects = ['jsfcore', 'jsfiller3', 'ws-editor-lib'];
const releasesRegExp = /^releases\//;
const filterInvalidReleases = groupppedBranchesObject => _.mapValues(
  groupppedBranchesObject, (repoBranches, branchName) => {
    if (releasesRegExp.test(branchName)) {
      for (let a = 0; a < releasesReqProjects.length; a++) {
        const reqProject = releasesReqProjects[a];
        if (!repoBranches.hasOwnProperty(reqProject)) return null;
      }
      if (!repoBranches.snfiller) return { ...repoBranches, snfiller: null };
    }

    return repoBranches;
  }
);

/**
 * Ветки с хотфиксами для определенных релизов нужно дополнить соответствующими
 * релизами:
 * 'hotfix/2.11/flat-groups': {
 *   'ws-editor-lib': 'ws-editor-lib/hotfix/2.11/flat-groups',
 * }
 * ->
 * 'hotfix/2.11/flat-groups': {
 *   'ws-editor-lib': 'ws-editor-lib/hotfix/2.11/flat-groups',
 *   jsfcore: 'jsfcore/releases/2.11',
 *   jsfiller3: 'jsfiller3/releases/2.11',
 *   snfiller: 'snfiller/releases/2.11'
 * }
 */
// https://regex101.com/r/hEeP9h/1/
const noDevelopBranches = /^[^release].+(2\.\d{1,2}).+$/;
const packages = ['jsfcore', 'jsfiller3', 'ws-editor-lib', 'snfiller'];
const appendReleasesBranches = (groupppedBranchesObject) => _.mapValues(
  groupppedBranchesObject, (repoBranches, branchName) => {
    const matches = branchName.match(noDevelopBranches);

    if (matches) {
      const version = matches[1];
      const versionBranch = `releases/${version}`;
      const versionBranches = groupppedBranchesObject[versionBranch];
      const newRepoBranches = { ...repoBranches };
      for (let a = 0; a < packages.length; a++) {
        const package = packages[a];
        if (!newRepoBranches.hasOwnProperty(package)) {
          newRepoBranches[package] = versionBranches[package]
        }
      }

      return newRepoBranches;
    }

    return repoBranches;
  }
);

/**
 * Дополняем все остальное develop ветками:
 * 'feature/SNF-482-DebugPanel': {
 *   'ws-editor-lib': 'ws-editor-lib/feature/SNF-482-DebugPanel',
 * }
 * ->
 * 'feature/SNF-482-DebugPanel': {
 *   'ws-editor-lib': 'ws-editor-lib/feature/SNF-482-DebugPanel',
 *   jsfcore: 'jsfcore/develop',
 *   jsfiller3: 'jsfiller3/develop',
 *   snfiller: 'snfiller/develop'
 * },
 */
const appendDevelopToOther = (groupppedBranchesObject) => _.mapValues(
  groupppedBranchesObject, (repoBranches, branchName) => {
    if (releasesRegExp.test(branchName)) return repoBranches;
    if (noDevelopBranches.test(branchName)) return repoBranches;

    const newRepoBranches = { ...repoBranches };
    for (let a = 0; a < packages.length; a++) {
      const package = packages[a];
      if (!newRepoBranches.hasOwnProperty(package)) {
        newRepoBranches[package] = groupppedBranchesObject.develop[package]
      }
    }

    return newRepoBranches;
  }
);

const filterNull = (groups) => _.pickBy(groups, e => e);

const branchFlow = _.flow([
  groupByBranchName,
  convertToObjects,
  filterInvalidReleases,
  appendReleasesBranches,
  appendDevelopToOther,
  filterNull,
]);

const octopusMerge = async ({ branches, branch, projects }) =>
  promiseSpawn(
    'bash', [
      '../makeMono/merge.sh',
      branch,
      ...Object.values(branches),
    ], resultPath, true
  );

(async () => {
  const branchesSource = await getBranchesArray();
  const groupppedBranchesObject = await branchFlow(branchesSource);

  /**
   * Указываем целевой бранч и собранный нами объект с ветками:
   */
  await octopusMerge({ branch: 'develop', branches: groupppedBranchesObject.develop });
})();
