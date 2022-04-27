"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unassign = exports.assign = exports.getByIp = void 0;
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
async function assign(api, floating_ip, droplet) {
    const parser = (res) => {
        if (res.action) {
            return res.action;
        }
        return null;
    };
    return api.post(parser, `/floating_ips/${floating_ip.ip}/actions`, {
        type: 'assign',
        droplet_id: droplet.id,
    });
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
