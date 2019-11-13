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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const semver = __importStar(require("semver"));
const semver_1 = require("semver");
class SemverRelease {
    constructor(inputs, client) {
        this.inputs = inputs;
        this.client = client;
        this.outputs = {
            oldVersion: '',
            newVersion: ''
        };
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const tag = yield this.getLatestTag();
            const commits = yield this.getCommitFromHeadToTag(tag);
            const messages = commits.slice(0, -1)
                .map(c => c.commit.message)
                .map(m => m.replace(/\r/g, ''))
                .map(m => m.replace(/\n\n/g, '\n'));
            const version = this.getVersionFromMessages(tag, messages);
            if (version != null) {
                this.outputs.newVersion = this.formatVersion(version);
                yield this.publishRelease(version, messages);
            }
            return this.outputs;
        });
    }
    getLatestTag() {
        return __awaiter(this, void 0, void 0, function* () {
            const tags = yield this.client.getTags();
            const versionTags = tags.filter(t => t.name.match(this.inputs.tagPrefix + '[0-9]+\.[0-9]+\.[0-9]+'));
            if (versionTags.length == 0) {
                return null;
            }
            return versionTags[0];
        });
    }
    getCommitFromHeadToTag(tag) {
        return __awaiter(this, void 0, void 0, function* () {
            let since;
            if (tag != null) {
                const commit = yield this.client.getCommit(tag.commit.sha);
                if (commit != null) {
                    since = commit.commit.author.date;
                }
            }
            return yield this.client.getCommits(since);
        });
    }
    getVersionFromMessages(tag, messages) {
        let version = new semver_1.SemVer(this.inputs.initVersion);
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
    formatVersion(version) {
        return `${this.inputs.tagPrefix}${version.format()}`;
    }
    publishRelease(version, messages) {
        return __awaiter(this, void 0, void 0, function* () {
            const tag = this.formatVersion(version);
            const changelog = messages.map(m => `* ${m}\n`).join('');
            const body = `**Changelog:**\n${changelog}`;
            const release = {
                tag_name: tag,
                target_commitish: 'master',
                name: tag,
                body: body,
                draft: false,
                prerelease: false
            };
            yield this.client.createRelease(release);
        });
    }
}
exports.SemverRelease = SemverRelease;
