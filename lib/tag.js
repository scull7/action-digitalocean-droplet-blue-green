"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeList = exports.remove = exports.add = exports.get = void 0;
function ensureResourceIDsAreStrings(resources) {
    return resources.map(resource => ({
        ...resource,
        resource_id: resource.resource_id.toString(),
    }));
}
async function get(api, tag_name) {
    const parser = (res) => {
        if (res.tag) {
            return res.tag.tag ? res.tag.tag : res.tag;
        }
        return null;
    };
    return api.get(parser, `/tags/${tag_name}`);
}
exports.get = get;
async function add(api, tag_name, resources) {
    const parser = (_res) => null;
    resources = ensureResourceIDsAreStrings(resources);
    return api.post(parser, `/tags/${tag_name}/resources`, { resources });
}
exports.add = add;
async function remove(api, tag_name, resources) {
    resources = ensureResourceIDsAreStrings(resources);
    return api.del(`/tags/${tag_name}/resources`, { resources });
}
exports.remove = remove;
async function removeList(api, tag_name_list, resources) {
    return Promise.all(tag_name_list.map((tag_name) => remove(api, tag_name, resources)));
}
exports.removeList = removeList;
