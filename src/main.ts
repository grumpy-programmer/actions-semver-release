import * as core from '@actions/core';
import {
  ReposGetCommitResponseData,
  ReposGetLatestReleaseResponseData,
  ReposListCommitsResponseData
} from '@octokit/types/dist-types/generated/Endpoints';
import { GithubService } from './github';
import { Version } from './version';

const github = new GithubService();

async function main() {
  const initVersion = core.getInput('init-version') || '0.0.0';
  const tagPrefix = core.getInput('tag-prefix') || 'v';

  const release = await github.getLatestRelease();

  const commit = await getReleaseCommit(release);

  const date = commit?.commit.author.date;

  const commits = await github.getCommits(date);

  const messages = extractMessages(commits);

  if (commit !== undefined) {
    messages.pop();
  }

  const version = Version.parse(release?.tag_name, initVersion);

  const newVersion = increaseVersionByMessages(version, messages);

  core.setOutput('old-version', version.toString(tagPrefix));
  core.setOutput('new-version', newVersion.toString(tagPrefix));

  if (newVersion.isIncreased()) {
    core.info(`Release: ${version.toString(tagPrefix)} -> ${newVersion.toString(tagPrefix)}`);

    const tag = newVersion.toString(tagPrefix);

    await createRelease(tag, messages);
  }
}

async function getReleaseCommit(release?: ReposGetLatestReleaseResponseData): Promise<ReposGetCommitResponseData | undefined> {
  if (release === undefined) {
    return;
  }

  const tags = await github.getTags();

  const tag = tags.find(tag => tag.name === release.tag_name);

  if (tag === undefined) {
    return;
  }

  return await github.getCommit(tag.commit.sha);
}

function extractMessages(commits: ReposListCommitsResponseData): string[] {
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

async function createRelease(tag: string, messages: string[]) {
  const changelog = messages.map(m => `* ${m}\n`).join('');
  const body = `**Changelog:**\n${changelog}`;

  await github.createRelease(tag, body);
}

main()
  .catch(e => core.error(e));
