import * as core from '@actions/core';
import { GithubService } from './github';

const github = new GithubService();

async function main() {
  const version = getState('version');
  const released = getParsedState<boolean>('released');
  const messages = getParsedState<string[]>('messages');

  if (released) {
    core.info(`Release: ${version}`);

    await createRelease(version, messages);
  }
}

async function createRelease(tag: string, messages: string[]) {
  const changelog = messages.map(m => `* ${m}\n`).join('');
  const body = `**Changelog:**\n${changelog}`;

  await github.createRelease(tag, body);
}

function getParsedState<T>(key: string): T {
  const state = getState(key);

  return JSON.parse(state);
}

function getState(key: string): string {
  const state = core.getState(key);

  core.debug(`state: ${key} = ${state}`);

  return state;
}

main()
  .catch(e => core.error(e));
