import { InputOptions } from '@actions/core';
import { IHttpClient, IRequestOptions } from '@actions/http-client/interfaces';

import * as Context from './context';
import * as Droplet from './droplet';
import type { IDroplet } from './droplet';
import * as FloatingIP from './floating-ip';
import type { IFloatingIP } from './floating-ip';
import * as Tag from './tag';

export interface ICore {
  info: (message: string) => void;
  getInput: (name: string, options: InputOptions) => string;
  setFailed: (error: string) => void;
}

export interface ITagSet {
  blue: string,
  green: string,
}

export interface IStepOptions {
  core: ICore,
  httpClientFactory: (options: IRequestOptions) => IHttpClient,
  tagSet: ITagSet,
}

export async function run(
  { core, httpClientFactory, tagSet }: IStepOptions
): Promise<void> {
  const context = Context.make(core);

  const api = Context.getAPI(context, httpClientFactory);
  const [ ipGreen, ipBlue ] = await Context.getGreenAndBlueFloatingIPs(api, context);
  const [ droplet1, droplet2 ] = await Context.getDropletPair(api, context);

  const tagArray = [ tagSet.green, tagSet.blue ];
  const resource1 = Droplet.toResource(droplet1);
  const resource2 = Droplet.toResource(droplet2);

  core.info(`Droplet #1 = ${droplet1.name}`);
  core.info(`Droplet #2 = ${droplet2.name}`);

  core.info(`Removing Tags: ${tagArray.join(', ')}`);
  await Tag.removeList(api, tagArray, [ resource1, resource2 ]);

  if (ipGreen.droplet) {
    core.info(`Removing GREEN Floating IP Assignment, IP = ${ipGreen.ip}`);
    await FloatingIP.unassign(api, ipGreen);
  }

  if (ipBlue.droplet) {
    core.info(`Removing BLUE Floating IP Assignment, IP = ${ipBlue.ip}`);
    await FloatingIP.unassign(api, ipBlue);
  }

  const [ dropletGreen, dropletBlue ] = getDropletAssignments(
    ipGreen, ipBlue, droplet1, droplet2
  );

  core.info(`PROMOTING ${dropletGreen.name} (ID=${dropletGreen.id}) to GREEN, IP=${ipGreen.ip}`);
  core.info(`DEMOTING ${dropletBlue.name} (ID=${dropletBlue.id}) to BLUE, IP=${ipBlue.ip}`);

  await Promise.all([
    FloatingIP.assign(api, ipGreen, dropletGreen),
    FloatingIP.assign(api, ipBlue, dropletBlue),
  ]);

  await Promise.all([
    Tag.add(api, tagSet.green, [ Droplet.toResource(dropletGreen) ]),
    Tag.add(api, tagSet.blue, [ Droplet.toResource(dropletBlue) ]),
  ]);

  return;
}

export function getDropletAssignments(
  ipGreen: IFloatingIP,
  ipBlue: IFloatingIP,
  droplet1: IDroplet,
  droplet2: IDroplet,
) {
  // It is assumed that the user's intention is to promote the blue server into
  // the production role.  Therefore, we only consider the blue droplet in the
  // the production role. Therefore, if we have the blue droplet assignment,
  // then we only consider the blue droplet in the ip switch.  This eliminates
  // the possibility where we have the blue and green droplet IPs assigned to
  // the same droplet instance.
  if (ipBlue.droplet) {
    return ipBlue.droplet.id === droplet1.id
      ? [ droplet1, droplet2 ]
      : [ droplet2, droplet1 ];
  }

  if (ipGreen.droplet) {
    return ipGreen.droplet.id === droplet1.id
      ? [ droplet2, droplet1 ]
      : [ droplet1, droplet2 ];
  }

  // otherwise, we don't have any assigned droplets.
  return [ droplet1, droplet2 ];
}
