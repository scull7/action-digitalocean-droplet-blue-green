import * as core from '@actions/core';
import { HttpClient } from '@actions/http-client';
import { IHttpClient, IRequestOptions } from '@actions/http-client/interfaces';

import * as Step from './step';

const TAG_SET = {
  blue: 'blue',
  green: 'green',
};

function httpClientFactory(options: IRequestOptions): IHttpClient {
  const userAgent = undefined; // Use the default user agent.
  const handlers = undefined;

  return new HttpClient(userAgent, handlers, options);
}

async function main() {
  try {
    await Step.run({ core, httpClientFactory, tagSet: TAG_SET });

    core.info('Docker Blue / Green Promotion Complete!');

  } catch (err) {
    core.setFailed(err);
  }

  return;
}

main();
