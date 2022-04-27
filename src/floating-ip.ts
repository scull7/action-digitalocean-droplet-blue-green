import type { IAction } from './action';
import type { IApi } from './api';
import type { IDroplet } from './droplet';
import type { IRegion } from './region';

type IPv4 = string;

export interface IFloatingIP {
  droplet?: IDroplet,
  locked: boolean,
  region: IRegion,
  ip: IPv4,
}

export async function getByIp(
  api: IApi,
  ip_address: string
): Promise<IFloatingIP | null> {
  const parser = (res: any) => {
    if (res.floating_ip) {
      return res.floating_ip;
    }
    return null;
  };

  return api.get(parser, `/floating_ips/${ip_address}`);
}

// @TODO - implement wait for action to complete.
export async function assign(
  api: IApi,
  floating_ip: IFloatingIP,
  droplet: IDroplet,
): Promise<IAction> {
  const parser = (res: any) => {
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

// @TODO - implement wait for action to complete.
export async function unassign(
  api: IApi,
  floating_ip: IFloatingIP,
): Promise<IAction> {
  const parser = (res: any) => {
    if (res.action) {
      return res.action;
    }
    return null;
  };

  return api.post(parser, `/floating_ips/${floating_ip.ip}/actions`, { type: 'unassign' });
}
