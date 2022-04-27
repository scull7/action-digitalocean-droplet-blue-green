import { URLSearchParams } from 'url';
import { IApi } from './api';
import { IResource, ResourceType } from './resource';

// This has to be a string because the URLSearchParams only accepts strings.
const MAX_ALLOWED_PER_PAGE = '200';

export interface IDroplet {
  id: string,
  name: string,
}

export function toResource(droplet: IDroplet): IResource {
  return {
    resource_id: droplet.id,
    resource_type: ResourceType.DROPLET,
  }
}

export function toResourceList(droplets: IDroplet[]): IResource[] {
  return droplets.map(toResource);
}

export async function getByTag(
  api: IApi,
  tag_name: string,
): Promise<IDroplet[]> {
  const query = new URLSearchParams({
    per_page: MAX_ALLOWED_PER_PAGE,
    page: '1',
    tag_name,
  });

  const parser = (res: any): IDroplet[] => {
    if (res.droplets) {
      return res.droplets;
    }

    return [];
  };

  const res: IDroplet[] | null = await api.get(
    parser,
    { path: `/droplets`, query }
  );

  return res == null ? [] : res;
}
