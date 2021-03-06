import * as core from '@actions/core';
import { CommitResponse, GithubService, Release } from './github';
import { Version } from './version';

const github = new GithubService();

async function main() {
  const initVersion = core.getInput('init-version') || '0.0.0';
  const tagPrefix = core.getInput('tag-prefix') || 'v';

  core.debug(`main: input initVersion: ${initVersion}`);
  core.debug(`main: input tagPrefix: ${tagPrefix}`);

  const releases = await github.getAllReleases();

  core.debug(`main: found ${releases.length} releases`);

  const release = getLatestRelease(releases, tagPrefix);

  core.debug(`main: found latest release tag: ${release?.tag_name}, created at: ${release?.created_at}`);

  const commit = await getReleaseCommit(release);

  core.debug(`main: found commit sha: ${commit?.sha}`);

  const date = commit?.commit?.author?.date;

  core.debug(`main: commit date: ${date}`);

  const commits = await github.getCommits(date);

  core.debug(`main: found ${commits.length} commits since ${date}`);

  const messages = extractMessages(commits);

  core.debug(`main: found ${messages.length} commit messages`);

  if (commit !== undefined) {
    messages.pop();
  }

  const oldVersion = Version.parse(release?.tag_name, initVersion, tagPrefix);
  const oldTag = oldVersion.toTag(tagPrefix);

  core.info(`last version: ${oldVersion}, tag: ${oldTag}`);

  const newVersion = increaseVersionByMessages(oldVersion, messages);

  const tag = newVersion.toTag(tagPrefix);
  const version = newVersion.toString();
  const released = newVersion.isIncreased();

  core.debug(`main: computed tag: ${tag}, version: ${version}, released: ${released}`);

  if (released) {
    core.info(`new version: ${version}, tag: ${tag}`);
  } else {
    core.info('no new version');
  }

  core.setOutput('tag', tag);
  core.setOutput('version', version);
  core.setOutput('released', released);

  core.debug(`main: output tag: ${tag}`);
  core.debug(`main: output version: ${version}`);
  core.debug(`main: output released: ${released}`);

  core.saveState('tag', tag);
  core.saveState('version', version);
  core.saveState('released', released);
  core.saveState('messages', messages);

  core.debug(`main: state set tag: ${tag}`);
  core.debug(`main: state set version: ${version}`);
  core.debug(`main: state set released: ${released}`);
  core.debug(`main: state set message count: ${messages.length}`);
}

function getLatestRelease(releases: Release[], prefix: string): Release | undefined {
  return releases.filter(release => release.tag_name.startsWith(prefix))
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
    .pop();
}

async function getReleaseCommit(release?: Release): Promise<CommitResponse | undefined> {
  if (release === undefined) {
    return;
  }

  const tags = await github.getTags();

  const tag = tags.find(t => t.name === release.tag_name);

  if (tag === undefined) {
    return;
  }

  return github.getCommit(tag.commit.sha);
}

function extractMessages(commits: CommitResponse[]): string[] {
  return commits
    .map(commit => commit.commit.message)
    .map(m => m.replace(/\r/g, ''))
    .map(m => m.replace(/\n\n/g, '\n'));
}

function increaseVersionByMessages(version: Version, messages: string[]): Version {
  if (messages.findIndex(m => m.indexOf('BREAKING CHANGE') >= 0) >= 0) {
    return version.increaseMajor();
  }

  if (messages.findIndex(m => m.startsWith('feat')) >= 0) {
    return version.increaseMinor();
  }

  if (messages.findIndex(m => m.startsWith('fix')) >= 0) {
    return version.increasePatch();
  }

  return version;
}

main()
  .catch(e => core.error(e));
