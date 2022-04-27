import { InputOptions } from '@actions/core'
import { IHttpClient, IRequestOptions } from '@actions/http-client/interfaces';
import { IApi, Api } from './api';
import * as Droplet from './droplet';
import type { IDroplet } from './droplet';
import * as FloatingIP from './floating-ip';
import type { IFloatingIP } from './floating-ip';

export interface IContext {
  digital_ocean_access_token: string,
  droplet_pair_tag: string,
  ip_green: string,
  ip_blue: string,
}

export interface IGetInput {
  getInput(name: string, options?: InputOptions): string,
}

function getRequiredString(core: IGetInput, name: string): string {
  return core.getInput(name, { required: true });
}


export function make(core: IGetInput) {
  return {
    digital_ocean_access_token: getRequiredString(
      core,
      'digital_ocean_access_token'
    ),
    droplet_pair_tag: getRequiredString(core, 'droplet_pair_tag'),
    ip_green: getRequiredString(core, 'ip_green'),
    ip_blue: getRequiredString(core, 'ip_blue'),
  };
}

export function getAPI(
  context: IContext,
  httpClientFactory: (options: IRequestOptions) => IHttpClient,
) {
  return new Api(context.digital_ocean_access_token, httpClientFactory);
}

export async function getGreenAndBlueFloatingIPs(
  api: any,
  context: IContext
): Promise<[IFloatingIP, IFloatingIP]> {
  const [ ipGreen, ipBlue ] = await Promise.all(
    [ context.ip_green, context.ip_blue ].map((ip) => FloatingIP.getByIp(api, ip))
  );

  if (ipGreen == null) {
    throw new TypeError(`GREEN IP (${context.ip_green}) did not map to an existing Floating IP`);
  }

  if (ipBlue == null) {
    throw new TypeError(`BLUE IP (${context.ip_blue}) did not map to an existing Floating IP`);
  }

  return [ ipGreen, ipBlue ];
}

export async function getDropletPair(
  api: any,
  context: IContext
): Promise<[IDroplet, IDroplet]> {
  const tagName = context.droplet_pair_tag;

  const result = await Droplet.getByTag(api, tagName);
  const count = result.length;

  if (count != 2) {
    const message =
      (count === 0) ? `Droplet tag ${tagName} did not map to any available droplets` :
      (count === 1) ? `Droplet tag ${tagName} only mapped to one droplet` :
      /* otherwise */ `Droplet tag ${tagName} mapped to more than two droplets`;

    throw new Error(message);
  }

  return [ result[0], result[1] ];
}
