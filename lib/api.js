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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Api = void 0;
const Path = __importStar(require("path"));
const url_1 = require("url");
const http_errors_1 = __importDefault(require("http-errors"));
const DIGITAL_OCEAN_API_DOMAIN = 'api.digitalocean.com';
const DIGITAL_OCEAN_API_PROTOCOL = 'https';
const DIGITAL_OCEAN_API_VERSION = 'v2';
const STATUS_CODES_SUCCESS = [200, 201, 202, 204];
class Api {
    constructor(token, httpClientFactory) {
        this.token = token;
        this.baseURL = `${DIGITAL_OCEAN_API_PROTOCOL}://${DIGITAL_OCEAN_API_DOMAIN}`;
        this.client = httpClientFactory({
            headers: {
                ["Authorization"]: `Bearer ${this.token}`,
                ["Content-Type"]: "application/json",
            },
        });
    }
    makeUrl(input) {
        if (typeof input === 'string') {
            const path = Path.join(DIGITAL_OCEAN_API_VERSION, input);
            return new url_1.URL(path, this.baseURL);
        }
        const path = Path.join(DIGITAL_OCEAN_API_VERSION, input.path);
        let url = new url_1.URL(path, this.baseURL);
        url.search = input.query.toString();
        return url;
    }
    async request(parser, req) {
        const requestUrl = req.url.toString();
        const data = JSON.stringify(req.data);
        const headers = req.headers || {};
        const res = await this.client.request(req.verb, requestUrl, data, headers);
        const body = await parseBody(res);
        const err = getError(req, res, body);
        if (err) {
            throw err;
        }
        if (body) {
            return parser(body);
        }
        return null;
    }
    async del(path, body) {
        const parser = (x) => x;
        return this.request(parser, {
            verb: 'DELETE',
            url: this.makeUrl(path),
            data: body,
        });
    }
    async get(parser, path) {
        return this.request(parser, {
            verb: 'GET',
            url: this.makeUrl(path),
            data: null,
        });
    }
    async post(parser, path, data) {
        return this.request(parser, {
            verb: 'POST',
            url: this.makeUrl(path),
            data,
        });
    }
}
exports.Api = Api;
async function parseBody(res) {
    try {
        let body = await res.readBody();
        if (body == null) {
            return null;
        }
        return JSON.parse(body);
    }
    catch (error) {
        return {
            id: 'internal::body_parse_error',
            message: error.message,
        };
    }
}
function getError(req, res, body) {
    let statusCode = res.message.statusCode || 500;
    if (STATUS_CODES_SUCCESS.includes(statusCode)) {
        return null;
    }
    if (body == null) {
        body = {
            id: 'EMPTY',
            message: 'Body was not present',
        };
    }
    const url = req.url.toString();
    const prefix = body.id ? body.id.toUpperCase() : 'UNKNOWN';
    let message = body.message ? body.message : 'Message was empty';
    message = `${prefix} (${statusCode}): ${url} :: ${message}`;
    return (0, http_errors_1.default)(statusCode, message);
}
