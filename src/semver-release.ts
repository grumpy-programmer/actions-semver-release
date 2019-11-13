import * as semver from 'semver';
import { SemVer } from 'semver';
import { GithubClient } from './github/client';
import { Commit } from './github/commit';
import { ReleaseRequest } from './github/releaseRequest';
import { Tag } from './github/tag';
import { Inputs, Outputs } from './io';

export class SemverRelease {

  private outputs: Outputs = {
    oldVersion: '',
    newVersion: ''
  };

  constructor(private inputs: Inputs, private client: GithubClient) {
  }

  public async run(): Promise<Outputs> {
    const tag = await this.getLatestTag();

    const commits = await this.getCommitFromHeadToTag(tag);

    const messages = commits.slice(0, -1)
      .map(c => c.commit.message)
      .map(m => m.replace(/\r/g, ''))
      .map(m => m.replace(/\n\n/g, '\n'));

    const version = this.getVersionFromMessages(tag, messages);
    if (version != null) {
      this.outputs.newVersion = this.formatVersion(version);

      await this.publishRelease(version, messages);
    }

    return this.outputs;
  }

  private async getLatestTag(): Promise<Tag | null> {
    const tags = await this.client.getTags();

    const versionTags = tags.filter(t => t.name.match(this.inputs.tagPrefix + '[0-9]+\.[0-9]+\.[0-9]+'));
    if (versionTags.length == 0) {
      return null;
    }

    return versionTags[ 0 ];
  }

  private async getCommitFromHeadToTag(tag: Tag | null): Promise<Commit[]> {
    let since: string | undefined;

    if (tag != null) {
      const commit = await this.client.getCommit(tag.commit.sha);

      if (commit != null) {
        since = commit.commit.author.date;
      }
    }

    return await this.client.getCommits(since);
  }

  private getVersionFromMessages(tag: Tag | null, messages: string[]): SemVer | null {
    let version = new SemVer(this.inputs.initVersion);

    if (tag != null) {
      const tagVersion = semver.parse(tag.name);
      version = tagVersion == null ? version : tagVersion;
    }

    this.outputs.oldVersion = this.formatVersion(version);

    if (messages.findIndex(m => m.indexOf('BREAKING CHANGE') >= 0) >= 0) {
      return version.inc('major');
    }

    if (messages.findIndex(m => m.startsWith('feat')) >= 0) {
      return version.inc('minor');
    }

    if (messages.findIndex(m => m.startsWith('fix')) >= 0) {
      return version.inc('patch');
    }

    return null;
  }

  private formatVersion(version: SemVer) {
    return `${this.inputs.tagPrefix}${version.format()}`;
  }

  private async publishRelease(version: SemVer, messages: string[]): Promise<void> {
    const tag = this.formatVersion(version);
    const changelog = messages.map(m => `* ${m}\n`).join('');
    const body = `**Changelog:**\n${changelog}`;

    const release: ReleaseRequest = {
      tag_name: tag,
      target_commitish: 'master',
      name: tag,
      body: body,
      draft: false,
      prerelease: false
    };

    await this.client.createRelease(release);
  }
}
