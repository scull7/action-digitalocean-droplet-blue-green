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
exports.getDropletAssignments = exports.run = void 0;
const Context = __importStar(require("./context"));
const Droplet = __importStar(require("./droplet"));
const FloatingIP = __importStar(require("./floating-ip"));
const Tag = __importStar(require("./tag"));
async function run({ core, httpClientFactory, tagSet }) {
    const context = Context.make(core);
    const api = Context.getAPI(context, httpClientFactory);
    const [ipGreen, ipBlue] = await Context.getGreenAndBlueFloatingIPs(api, context);
    const [droplet1, droplet2] = await Context.getDropletPair(api, context);
    const tagArray = [tagSet.green, tagSet.blue];
    const resource1 = Droplet.toResource(droplet1);
    const resource2 = Droplet.toResource(droplet2);
    core.info(`Droplet #1 = ${droplet1.name}`);
    core.info(`Droplet #2 = ${droplet2.name}`);
    core.info(`Removing Tags: ${tagArray.join(', ')}`);
    await Tag.removeList(api, tagArray, [resource1, resource2]);
    if (ipGreen.droplet) {
        core.info(`Removing GREEN Floating IP Assignment, IP = ${ipGreen.ip}`);
        await FloatingIP.unassign(api, ipGreen);
    }
    if (ipBlue.droplet) {
        core.info(`Removing BLUE Floating IP Assignment, IP = ${ipBlue.ip}`);
        await FloatingIP.unassign(api, ipBlue);
    }
    const [dropletGreen, dropletBlue] = getDropletAssignments(ipGreen, ipBlue, droplet1, droplet2);
    core.info(`PROMOTING ${dropletGreen.name} (ID=${dropletGreen.id}) to GREEN, IP=${ipGreen.ip}`);
    core.info(`DEMOTING ${dropletBlue.name} (ID=${dropletBlue.id}) to BLUE, IP=${ipBlue.ip}`);
    await Promise.all([
        FloatingIP.assign(api, ipGreen, dropletGreen),
        FloatingIP.assign(api, ipBlue, dropletBlue),
    ]);
    await Promise.all([
        Tag.add(api, tagSet.green, [Droplet.toResource(dropletGreen)]),
        Tag.add(api, tagSet.blue, [Droplet.toResource(dropletBlue)]),
    ]);
    return;
}
exports.run = run;
function getDropletAssignments(ipGreen, ipBlue, droplet1, droplet2) {
    if (ipBlue.droplet) {
        return ipBlue.droplet.id === droplet1.id
            ? [droplet1, droplet2]
            : [droplet2, droplet1];
    }
    if (ipGreen.droplet) {
        return ipGreen.droplet.id === droplet1.id
            ? [droplet2, droplet1]
            : [droplet1, droplet2];
    }
    return [droplet1, droplet2];
}
exports.getDropletAssignments = getDropletAssignments;
