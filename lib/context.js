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
exports.getDropletPair = exports.getGreenAndBlueFloatingIPs = exports.getAPI = exports.make = void 0;
const api_1 = require("./api");
const Droplet = __importStar(require("./droplet"));
const FloatingIP = __importStar(require("./floating-ip"));
function getRequiredString(core, name) {
    return core.getInput(name, { required: true });
}
function make(core) {
    return {
        digital_ocean_access_token: getRequiredString(core, 'digital_ocean_access_token'),
        droplet_pair_tag: getRequiredString(core, 'droplet_pair_tag'),
        ip_green: getRequiredString(core, 'ip_green'),
        ip_blue: getRequiredString(core, 'ip_blue'),
    };
}
exports.make = make;
function getAPI(context, httpClientFactory) {
    return new api_1.Api(context.digital_ocean_access_token, httpClientFactory);
}
exports.getAPI = getAPI;
async function getGreenAndBlueFloatingIPs(api, context) {
    const [ipGreen, ipBlue] = await Promise.all([context.ip_green, context.ip_blue].map((ip) => FloatingIP.getByIp(api, ip)));
    if (ipGreen == null) {
        throw new TypeError(`GREEN IP (${context.ip_green}) did not map to an existing Floating IP`);
    }
    if (ipBlue == null) {
        throw new TypeError(`BLUE IP (${context.ip_blue}) did not map to an existing Floating IP`);
    }
    return [ipGreen, ipBlue];
}
exports.getGreenAndBlueFloatingIPs = getGreenAndBlueFloatingIPs;
async function getDropletPair(api, context) {
    const tagName = context.droplet_pair_tag;
    const result = await Droplet.getByTag(api, tagName);
    const count = result.length;
    if (count != 2) {
        const message = (count === 0) ? `Droplet tag ${tagName} did not map to any available droplets` :
            (count === 1) ? `Droplet tag ${tagName} only mapped to one droplet` :
                `Droplet tag ${tagName} mapped to more than two droplets`;
        throw new Error(message);
    }
    return [result[0], result[1]];
}
exports.getDropletPair = getDropletPair;
