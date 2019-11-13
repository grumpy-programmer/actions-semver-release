"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const RestClient_1 = require("typed-rest-client/RestClient");
class GithubClient {
    constructor() {
        this.endpoint = 'https://api.github.com';
        [this.owner, this.repo] = this.getOwnerAndRepo();
        const token = this.getToken();
        this.client = new RestClient_1.RestClient('nodejs', this.endpoint, undefined, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }
    getTags() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.client.get(`${this.endpoint}/repos/${this.owner}/${this.repo}/tags`);
            if (response.statusCode != 200) {
                throw new Error(`could not get tags: status ${response.statusCode} from ${this.endpoint}/repos/${this.owner}/${this.repo}/tags, result: ${JSON.stringify(response.result)}`);
            }
            if (response.result == null) {
                return [];
            }
            return response.result;
        });
    }
    getCommits(since) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = since == undefined ? '' : `?since=${since}`;
            const response = yield this.client.get(`${this.endpoint}/repos/${this.owner}/${this.repo}/commits${query}`);
            if (response.statusCode != 200) {
                throw new Error(`could not get commits from ${this.endpoint}/repos/${this.owner}/${this.repo}/commits${query}: status ${response.statusCode}, result: ${JSON.stringify(response.result)}`);
            }
            if (response.result == null) {
                return [];
            }
            return response.result;
        });
    }
    getCommit(sha) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.client.get(`${this.endpoint}/repos/${this.owner}/${this.repo}/commits/${sha}`);
            if (response.statusCode != 200) {
                throw new Error(`could not get commit from ${this.endpoint}/repos/${this.owner}/${this.repo}/commits/${sha}: status ${response.statusCode}, result: ${JSON.stringify(response.result)}`);
            }
            if (response.result == null) {
                return null;
            }
            return response.result;
        });
    }
    createRelease(release) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.client.create(`${this.endpoint}/repos/${this.owner}/${this.repo}/releases`, release);
            if (response.statusCode != 201) {
                throw new Error(`could not create release from ${this.endpoint}/repos/${this.owner}/${this.repo}/releases, result: ${JSON.stringify(response.result)}`);
            }
            if (response.result == null) {
                return null;
            }
            return response.result;
        });
    }
    getOwnerAndRepo() {
        const repository = process.env.GITHUB_REPOSITORY;
        if (repository == undefined) {
            throw new Error('env var GITHUB_REPOSITORY not found');
        }
        return repository.split('/');
    }
    getToken() {
        const token = process.env.GITHUB_TOKEN;
        if (token == undefined) {
            throw new Error('env var GITHUB_TOKEN not found');
        }
        return token;
    }
}
exports.GithubClient = GithubClient;
