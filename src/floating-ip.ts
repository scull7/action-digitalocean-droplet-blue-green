import { ActionStatus } from './action';
import type { IAction } from './action';
import type { IApi } from './api';
import type { IDroplet } from './droplet';
import type { IRegion } from './region';
import type { ITimeout } from './timeout';

type IPv4 = string;

export interface IFloatingIP {
  droplet?: IDroplet,
  locked: boolean,
  region: IRegion,
  ip: IPv4,
}

export async function getActions(
  api: IApi,
  ip_address: IFloatingIP,
): Promise<IAction[] | null> {
  const parser = (res: any): IAction[] => {
    if (Array.isArray(res.actions)) {
      return res.actions;
    }
    return [];
  };

  return api.get(parser, `/floating_ips/${ip_address.ip}/actions`);
}

export async function getByIp(
  api: IApi,
  ip_address: string,
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

export async function waitForInProgressActions(
  api: IApi,
  timeout: ITimeout,
  ip_address: IFloatingIP,
): Promise<void> {
  let hasInProgress = true;

  const start = timeout.getStart();
  const isInProgress = (action: IAction) => ActionStatus.IN_PROGRESS === action.status;
  
  while(hasInProgress) {
    const actions = await getActions(api, ip_address);
    hasInProgress = actions == null ? false : actions.some(isInProgress);

    if (timeout.hasExpired(start)) {
      throw new Error(`Timed out awaiting actions for IP = ${ip_address.ip}`);
    }
  }

  return;
}

export async function waitThenAssign(
  api: IApi,
  timeout: ITimeout,
  ip_address: IFloatingIP,
  droplet: IDroplet,
): Promise<IAction> {
  await waitForInProgressActions(api, timeout, ip_address);

  return assign(api, ip_address, droplet);
}
