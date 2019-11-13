import * as core from '@actions/core';
import { GithubClient } from './github/client';
import { Inputs } from './io';
import { SemverRelease } from './semver-release';

async function run() {
  const client = new GithubClient();

  const inputs: Inputs = {
    initVersion: core.getInput('init-version') || '0.0.0',
    tagPrefix: core.getInput('tag-prefix') || 'v'
  };

  const release = new SemverRelease(inputs, client);

  const outputs = await release.run();

  core.setOutput('old-version', outputs.oldVersion);
  core.setOutput('new-version', outputs.newVersion);

  core.info(`oldVersion: ${outputs.oldVersion}`);
  core.info(`newVersion: ${outputs.newVersion}`);
}

try {
  run();
} catch (e) {
  core.setFailed(e.message);
}

