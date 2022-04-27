"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getByTag = exports.toResourceList = exports.toResource = void 0;
const url_1 = require("url");
const resource_1 = require("./resource");
const MAX_ALLOWED_PER_PAGE = '200';
function toResource(droplet) {
    return {
        resource_id: droplet.id,
        resource_type: resource_1.ResourceType.DROPLET,
    };
}
exports.toResource = toResource;
function toResourceList(droplets) {
    return droplets.map(toResource);
}
exports.toResourceList = toResourceList;
async function getByTag(api, tag_name) {
    const query = new url_1.URLSearchParams({
        per_page: MAX_ALLOWED_PER_PAGE,
        page: '1',
        tag_name,
    });
    const parser = (res) => {
        if (res.droplets) {
            return res.droplets;
        }
        return [];
    };
    const res = await api.get(parser, { path: `/droplets`, query });
    return res == null ? [] : res;
}
exports.getByTag = getByTag;
