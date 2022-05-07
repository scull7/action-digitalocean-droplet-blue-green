"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitThenAssign = exports.waitForInProgressActions = exports.unassign = exports.assign = exports.getByIp = exports.getActions = void 0;
const action_1 = require("./action");
const RETRY_COUNT = 3;
const DELAY_MILLIS = 5000;
async function getActions(api, ip_address) {
    const parser = (res) => {
        if (Array.isArray(res.actions)) {
            return res.actions;
        }
        return [];
    };
    return api.get(parser, `/floating_ips/${ip_address.ip}/actions`);
}
exports.getActions = getActions;
async function getByIp(api, ip_address) {
    const parser = (res) => {
        if (res.floating_ip) {
            return res.floating_ip;
        }
        return null;
    };
    return api.get(parser, `/floating_ips/${ip_address}`);
}
exports.getByIp = getByIp;
async function assign(api, floating_ip, droplet, retryCount = RETRY_COUNT) {
    const parser = (res) => {
        if (res.action) {
            return res.action;
        }
        return null;
    };
    const delay = (millis) => new Promise((resolve, _reject) => setTimeout(() => resolve(), millis));
    try {
        return await api.post(parser, `/floating_ips/${floating_ip.ip}/actions`, {
            type: 'assign',
            droplet_id: droplet.id,
        });
    }
    catch (err) {
        if (err.status === 422 && retryCount > 0) {
            await delay(DELAY_MILLIS);
            return assign(api, floating_ip, droplet, retryCount - 1);
        }
        else {
            throw err;
        }
    }
}
exports.assign = assign;
async function unassign(api, floating_ip) {
    const parser = (res) => {
        if (res.action) {
            return res.action;
        }
        return null;
    };
    return api.post(parser, `/floating_ips/${floating_ip.ip}/actions`, { type: 'unassign' });
}
exports.unassign = unassign;
async function waitForInProgressActions(api, timeout, ip_address) {
    let hasInProgress = true;
    const start = timeout.getStart();
    const isInProgress = (action) => action_1.ActionStatus.IN_PROGRESS === action.status;
    while (hasInProgress) {
        const actions = await getActions(api, ip_address);
        hasInProgress = actions == null ? false : actions.some(isInProgress);
        if (timeout.hasExpired(start)) {
            throw new Error(`Timed out awaiting actions for IP = ${ip_address.ip}`);
        }
    }
    return;
}
exports.waitForInProgressActions = waitForInProgressActions;
async function waitThenAssign(api, timeout, ip_address, droplet) {
    await waitForInProgressActions(api, timeout, ip_address);
    return assign(api, ip_address, droplet);
}
exports.waitThenAssign = waitThenAssign;
