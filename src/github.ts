import * as core from '@actions/core';
import * as github from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';

export interface Release {
  tag_name: string;
  created_at: string;
  published_at: string | null;
}

export interface CreatedReleaseResponse {

}

export type TagResponse = Tag[]

export interface Tag {
  name: string;
  commit: TagCommit;
}

export interface TagCommit {
  sha: string;
}

export interface CommitResponse {
  sha: string;
  commit: Commit;
}

export interface Commit {
  message: string;
  author: Author | null;
}

export interface Author {
  date?: string;
}

export class GithubService {
  private readonly client: InstanceType<typeof GitHub>;
  private readonly owner: string;
  private readonly repo: string;

  constructor() {
    [this.owner, this.repo] = this.getOwnerAndRepo();

    const token = this.getToken();

    core.debug(`github: creating client owner: ${this.owner}, repo: ${this.repo}, token: ${token.length > 0 ? 'present' : 'not present'}`);

    this.client = github.getOctokit(token);
  }

  public async getLatestRelease(): Promise<Release | undefined> {
    core.debug('github: getting latest release');

    const release = await this.client.rest.repos.getLatestRelease({
      owner: this.owner,
      repo: this.repo
    })
      .then(response => response.data)
      .catch(() => undefined);

    core.debug(`github: found latest release tag: ${release?.tag_name}`);

    return release;
  }

  public async getAllReleases(limit: number = 10): Promise<Release[]> {
    core.debug(`github: getting all releases, limit: ${limit}`);

    const perPage = 100;

    const releases: Release[] = [];

    for (let page = 1; page < limit; page++) {
      const nextReleases = await this.getReleases(page, perPage);

      core.debug(`github: found: ${nextReleases.length} new releases on page: ${page}, already found: ${releases.length} releases`);

      releases.push(...nextReleases);

      if (nextReleases.length < perPage) {
        break;
      }
    }

    core.debug(`github: found: ${releases.length} releases`);

    return releases;
  }

  public async getReleases(page: number = 1, perPage: number = 30): Promise<Release[]> {
    core.debug(`github: getting releases page: ${page}, per page: ${perPage}`);

    const releases = await this.client.rest.repos.listReleases({
      owner: this.owner,
      repo: this.repo,
      page: page,
      per_page: perPage
    })
      .then(response => response.data);

    core.debug(`github: found: ${releases.length} releases, on page: ${page}, per page: ${perPage}`);

    return releases;
  }

  public async createRelease(tag: string, body: string): Promise<CreatedReleaseResponse> {
    core.debug(`github: creating release with tag: ${tag}`);

    return this.client.rest.repos.createRelease({
      owner: this.owner,
      repo: this.repo,
      tag_name: tag,
      name: tag,
      body: body,
      draft: false,
      prerelease: false
    })
      .then(response => response.data);
  }

  public async getTags(): Promise<TagResponse> {
    core.debug('github: getting tags');

    const tags = await this.client.rest.repos.listTags({
      owner: this.owner,
      repo: this.repo
    })
      .then(response => response.data);

    core.debug(`github: found: ${tags.length} tags`);

    return tags;
  }

  public async getCommit(sha: string): Promise<CommitResponse> {
    core.debug(`github: getting commit sha: ${sha}`);

    const commit = await this.client.rest.repos.getCommit({
      owner: this.owner,
      repo: this.repo,
      ref: sha
    })
      .then(response => response.data);

    core.debug(`github: found commit sha: ${commit.sha}`);

    return commit;
  }

  public async getCommits(since?: string): Promise<CommitResponse[]> {
    core.debug(`github: getting commits since: ${since}`);

    const commits = await this.client.rest.repos.listCommits({
      owner: this.owner,
      repo: this.repo,
      since: since
    })
      .then(response => response.data);

    core.debug(`github: found ${commits.length} commits`);

    return commits;
  }

  private getToken(): string {
    const token = process.env.GITHUB_TOKEN;
    if (token == undefined) {
      throw new Error('env var GITHUB_TOKEN not found');
    }

    return token;
  }

  private getOwnerAndRepo(): string[] {
    const repository = process.env.GITHUB_REPOSITORY;
    if (repository == undefined) {
      throw new Error('env var GITHUB_REPOSITORY not found');
    }

    if (repository.indexOf('/') < 0) {
      throw new Error('env var GITHUB_REPOSITORY contains invalid repository value');
    }

    return repository.split('/');
  }
}
