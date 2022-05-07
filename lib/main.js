"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const http_client_1 = require("@actions/http-client");
const Timeout = __importStar(require("./timeout"));
const Step = __importStar(require("./step"));
const TAG_SET = {
    blue: 'blue',
    green: 'green',
};
const THIRTY_SECONDS = 30000;
function httpClientFactory(options) {
    const userAgent = undefined;
    const handlers = undefined;
    return new http_client_1.HttpClient(userAgent, handlers, options);
}
async function main() {
    try {
        const timeout = Timeout.make(THIRTY_SECONDS);
        await Step.run({ core, httpClientFactory, tagSet: TAG_SET, timeout, });
        core.info('Docker Blue / Green Promotion Complete!');
    }
    catch (err) {
        core.setFailed(err);
    }
    return;
}
main();
