import * as github from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';
import {
  ReposCreateReleaseResponseData,
  ReposGetCommitResponseData,
  ReposGetLatestReleaseResponseData,
  ReposListCommitsResponseData,
  ReposListTagsResponseData
} from '@octokit/types/dist-types/generated/Endpoints';

export class GithubService {
  private client: InstanceType<typeof GitHub>;
  private owner: string;
  private repo: string;

  constructor() {
    [this.owner, this.repo] = this.getOwnerAndRepo();

    const token = this.getToken();
    this.client = github.getOctokit(token);
  }

  public async getLatestRelease(): Promise<ReposGetLatestReleaseResponseData | undefined> {
    return await this.client.repos.getLatestRelease({
      owner: this.owner,
      repo: this.repo
    })
      .then(response => response.data)
      .catch(() => undefined);
  }

  public async createRelease(tag: string, body: string): Promise<ReposCreateReleaseResponseData> {
    return await this.client.repos.createRelease({
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

  public async getTags(): Promise<ReposListTagsResponseData> {
    return await this.client.repos.listTags({
      owner: this.owner,
      repo: this.repo
    })
      .then(response => response.data);
  }

  public async getCommit(sha: string): Promise<ReposGetCommitResponseData> {
    return await this.client.repos.getCommit({
      owner: this.owner,
      repo: this.repo,
      ref: sha
    })
      .then(response => response.data);
  }

  public async getCommits(since?: string): Promise<ReposListCommitsResponseData> {
    return await this.client.repos.listCommits({
      owner: this.owner,
      repo: this.repo,
      since: since
    })
      .then(response => response.data);
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

    return repository.split('/');
  }
}
