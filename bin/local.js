#!/usr/bin/env node

const { HttpClient } = require('@actions/http-client');
const Step = require('../lib/step');
const Timeout = require('../lib/timeout');

const INPUT = {
  digital_ocean_access_token: process.env['DIGITALOCEAN_ACCESS_TOKEN'],
  droplet_pair_tag: process.env['DROPLET_PAIR_TAG'],
  ip_green: process.env['IP_GREEN'],
  ip_blue: process.env['IP_BLUE'],
};

const TAG_SET = {
  blue: 'blue',
  green: 'green',
};

const THIRTY_SECONDS = 30000;

const getInput = (name, options) => {
  const value = INPUT[name];

  if (value == null && options.required) {
    throw new Error(`${name} is a required input value`);
  }

  return value;
};

const httpClientFactory = (options) => {
  const userAgent = undefined;
  const handlers = undefined;

  return new HttpClient(userAgent, handlers, options);
};

const info = (...args) => console.info(...args);

async function main() {
  const core = { getInput, info };
  const timeout = Timeout.make(THIRTY_SECONDS);

  await Step.run({ core, httpClientFactory, tagSet: TAG_SET, timeout });

  return;
};

main();
