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
const core = __importStar(require("@actions/core"));
const client_1 = require("./github/client");
const semver_release_1 = require("./semver-release");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = new client_1.GithubClient();
        const inputs = {
            initVersion: core.getInput('init-version') || '0.0.0',
            tagPrefix: core.getInput('tag-prefix') || 'v'
        };
        const release = new semver_release_1.SemverRelease(inputs, client);
        const outputs = yield release.run();
        core.setOutput('old-version', outputs.oldVersion);
        core.setOutput('new-version', outputs.newVersion);
        core.info(`oldVersion: ${outputs.oldVersion}`);
        core.info(`newVersion: ${outputs.newVersion}`);
    });
}
try {
    run();
}
catch (e) {
    core.setFailed(e.message);
}
