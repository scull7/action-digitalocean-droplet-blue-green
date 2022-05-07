import { ActionStatus } from './action';
import type { IAction } from './action';
import type { IApi } from './api';
import type { IDroplet } from './droplet';
import type { IRegion } from './region';
import type { ITimeout } from './timeout';

type IPv4 = string;

const RETRY_COUNT = 3;
const DELAY_MILLIS = 5000; // 5 seconds

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
  retryCount: number = RETRY_COUNT,
): Promise<IAction> {
  const parser = (res: any) => {
    if (res.action) {
      return res.action;
    }
    return null;
  };

  const delay = (millis: number): Promise<void> =>
    new Promise((resolve, _reject) => setTimeout(() => resolve(), millis));

  try {
    return await api.post(parser, `/floating_ips/${floating_ip.ip}/actions`, {
      type: 'assign',
      droplet_id: droplet.id,
    });
  } catch (err) {
    // UNPROCESSABLE_ENTITY (422): The floating IP already has a pending event
    // We should await the previous event.
    if (err.status === 422 && retryCount > 0) {
      await delay(DELAY_MILLIS);

      return assign(api, floating_ip, droplet, retryCount - 1);

    } else {
      throw err;
    }
  }
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
