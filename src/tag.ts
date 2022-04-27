import type { IApi } from './api';
import type { IResource } from './resource';

export interface IResourceList {
  count: number,
}

export interface ITag {
  name: string,
  resources: IResourceList,
}

export async function get(
  api: IApi,
  tag_name: string,
): Promise<ITag | null> {
  const parser = (res: any) => {
    if (res.tag) {
      return res.tag.tag ? res.tag.tag : res.tag;
    }
    return null;
  };

  return api.get(parser, `/tags/${tag_name}`);
}

export async function add(
  api: IApi,
  tag_name: string,
  resources: IResource[],
): Promise<null> {
  const parser = (_res: any) => null;

  return api.post(parser, `/tags/${tag_name}/resources`, { resources });
}

export async function remove(
  api: IApi,
  tag_name: string,
  resources: IResource[],
): Promise<void> {
  return api.del(`/tags/${tag_name}/resources`, { resources });
}

export async function removeList(
  api: IApi,
  tag_name_list: string[],
  resources: IResource[],
): Promise<void[]> {
  return Promise.all(
    tag_name_list.map((tag_name) => remove(api, tag_name, resources))
  );
}
