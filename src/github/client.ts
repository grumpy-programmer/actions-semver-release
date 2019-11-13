import { RestClient } from 'typed-rest-client/RestClient';
import { Commit } from './commit';
import { ReleaseRequest, ReleaseResponse } from './releaseRequest';
import { Tag } from './tag';

export class GithubClient {
  private readonly endpoint = 'https://api.github.com';
  private owner: string;
  private repo: string;
  private client: RestClient;

  constructor() {
    [this.owner, this.repo] = this.getOwnerAndRepo();
    const token = this.getToken();
    this.client = new RestClient('nodejs', this.endpoint, undefined, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  public async getTags(): Promise<Tag[]> {
    const response = await this.client.get<Tag[]>(`${this.endpoint}/repos/${this.owner}/${this.repo}/tags`);

    if (response.statusCode != 200) {
      throw new Error(`could not get tags: status ${response.statusCode} from ${this.endpoint}/repos/${this.owner}/${this.repo}/tags, result: ${JSON.stringify(response.result)}`);
    }

    if (response.result == null) {
      return [];
    }

    return response.result;
  }

  public async getCommits(since?: string): Promise<Commit[]> {
    const query = since == undefined ? '' : `?since=${since}`;

    const response = await this.client.get<Commit[]>(`${this.endpoint}/repos/${this.owner}/${this.repo}/commits${query}`);

    if (response.statusCode != 200) {
      throw new Error(`could not get commits from ${this.endpoint}/repos/${this.owner}/${this.repo}/commits${query}: status ${response.statusCode}, result: ${JSON.stringify(response.result)}`);
    }

    if (response.result == null) {
      return [];
    }

    return response.result;
  }

  public async getCommit(sha: string): Promise<Commit | null> {
    const response = await this.client.get<Commit>(`${this.endpoint}/repos/${this.owner}/${this.repo}/commits/${sha}`);

    if (response.statusCode != 200) {
      throw new Error(`could not get commit from ${this.endpoint}/repos/${this.owner}/${this.repo}/commits/${sha}: status ${response.statusCode}, result: ${JSON.stringify(response.result)}`);
    }

    if (response.result == null) {
      return null;
    }

    return response.result;
  }


  public async createRelease(release: ReleaseRequest): Promise<ReleaseResponse | null> {
    const response = await this.client.create<ReleaseResponse>(`${this.endpoint}/repos/${this.owner}/${this.repo}/releases`, release);
    if (response.statusCode != 201) {
      throw new Error(`could not create release from ${this.endpoint}/repos/${this.owner}/${this.repo}/releases, result: ${JSON.stringify(response.result)}`);
    }

    if (response.result == null) {
      return null;
    }

    return response.result;
  }

  private getOwnerAndRepo(): string[] {
    const repository = process.env.GITHUB_REPOSITORY;
    if (repository == undefined) {
      throw new Error('env var GITHUB_REPOSITORY not found');
    }

    return repository.split('/');
  }

  private getToken(): string {
    const token = process.env.GITHUB_TOKEN;
    if (token == undefined) {
      throw new Error('env var GITHUB_TOKEN not found');
    }

    return token;
  }
}
