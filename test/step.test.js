const test = require('ava');
const Sinon = require('sinon');

const Core = require('@actions/core');
const { HttpClient } = require('@actions/http-client');

const Step = require('../lib/step.js');

const HttpClientFactory = require('./util/http-client-factory');
const InputStub = require('./util/input-stub');

const tagSet = {
  green: 'test-green',
  blue: 'test-blue',
};

const timeout = {
  getStart: () => 1,

  hasExpired: (_start) => false,
};

test('It should fail when not given a digital_ocean_access_token', async (t) => {
  const httpClientFactory = (options) => {
    return new HttpClient(undefined, undefined, options);
  };

  const thrower = () => Step.run({ core: Core, httpClientFactory, tagSet });

  const expectation = {
    message: 'Input required and not supplied: digital_ocean_access_token',
  };

  await t.throwsAsync(thrower, expectation);
});

test('It should perform a blue to green promotion', async (t) => {
    const droplet1 = {
      id: 'test-droplet-1',
      name: 'test-droplet-1-name',
    };
    const droplet2 = {
      id: 'test-droplet-2',
      name: 'test-droplet-2-name',
    };

  const config = {
    dropletPairTag: 'test-environment',
    droplet1,
    droplet2,
    ipGreen: {
      ip: '10.1.1.1',
      droplet: droplet1,
    },
    ipBlue: {
      ip: '10.1.1.2',
      droplet: droplet2,
    },
    tagSet,
    expectedAssignments: {
      blue: droplet1,
      green: droplet2, 
    }
  };

  const infoStub = Sinon.stub().returns(null);
  const inputStub = InputStub.full(config);

  const core = {
    info: infoStub,
    getInput: inputStub,
  };
  
  const httpClientFactory = HttpClientFactory.success(config);

  await Step.run({ core, httpClientFactory, tagSet, timeout });

  t.assert(infoStub.calledWith(`Droplet #1 = ${droplet1.name}`));
  t.assert(infoStub.calledWith(`Droplet #2 = ${droplet2.name}`));
  t.assert(infoStub.calledWith(
    `Removing Tags: ${[ tagSet.green, tagSet.blue ].join(', ')}`
  ));
  t.assert(infoStub.calledWith(
    `Removing GREEN Floating IP Assignment, IP = ${config.ipGreen.ip}`
  ));
  t.assert(infoStub.calledWith(
    `Removing BLUE Floating IP Assignment, IP = ${config.ipBlue.ip}`
  ));
  t.assert(infoStub.calledWith(
    `PROMOTING ${droplet2.name} (ID=${droplet2.id}) to GREEN, IP=${config.ipGreen.ip}`
  ));
  t.assert(infoStub.calledWith(
    `DEMOTING ${droplet1.name} (ID=${droplet1.id}) to BLUE, IP=${config.ipBlue.ip}`
  ));
});

test('It should assign droplet1 to green and droplet2 to blue when neither IP is assigned', async (t) => {
    const droplet1 = {
      id: 'test-droplet-1',
      name: 'test-droplet-1-name',
    };
    const droplet2 = {
      id: 'test-droplet-2',
      name: 'test-droplet-2-name',
    };

  const config = {
    dropletPairTag: 'test-environment',
    droplet1,
    droplet2,
    ipGreen: {
      ip: '10.1.1.1',
    },
    ipBlue: {
      ip: '10.1.1.2',
    },
    tagSet,
    expectedAssignments: {
      green: droplet1,
      blue: droplet2,
    },
  };

  const infoStub = Sinon.stub().returns(null);
  const inputStub = InputStub.full(config);

  const core = {
    info: infoStub,
    getInput: inputStub,
  };
  
  const httpClientFactory = HttpClientFactory.success(config);

  await Step.run({ core, httpClientFactory, tagSet, timeout });

  t.assert(infoStub.calledWith(`Droplet #1 = ${droplet1.name}`));
  t.assert(infoStub.calledWith(`Droplet #2 = ${droplet2.name}`));
  t.assert(infoStub.calledWith(
    `Removing Tags: ${[ tagSet.green, tagSet.blue ].join(', ')}`
  ));
  t.assert(infoStub.neverCalledWith(
    `Removing GREEN Floating IP Assignment, IP = ${config.ipGreen.ip}`
  ));
  t.assert(infoStub.neverCalledWith(
    `Removing BLUE Floating IP Assignment, IP = ${config.ipBlue.ip}`
  ));
  t.assert(infoStub.calledWith(
    `PROMOTING ${droplet1.name} (ID=${droplet1.id}) to GREEN, IP=${config.ipGreen.ip}`
  ));
  t.assert(infoStub.calledWith(
    `DEMOTING ${droplet2.name} (ID=${droplet2.id}) to BLUE, IP=${config.ipBlue.ip}`
  ));
});

test('It should assign droplet1 to green and droplet2 to blue when only the blue IP is assigned to droplet2', async (t) => {
    const droplet1 = {
      id: 'test-droplet-1',
      name: 'test-droplet-1-name',
    };
    const droplet2 = {
      id: 'test-droplet-2',
      name: 'test-droplet-2-name',
    };

  const config = {
    dropletPairTag: 'test-environment',
    droplet1,
    droplet2,
    ipGreen: {
      ip: '10.1.1.1',
    },
    ipBlue: {
      ip: '10.1.1.2',
      droplet: droplet2,
    },
    tagSet,
    expectedAssignments: {
      green: droplet2,
      blue: droplet1,
    },
  };

  const infoStub = Sinon.stub().returns(null);
  const inputStub = InputStub.full(config);

  const core = {
    info: infoStub,
    getInput: inputStub,
  };
  
  const httpClientFactory = HttpClientFactory.success(config);

  await Step.run({ core, httpClientFactory, tagSet, timeout });

  t.assert(infoStub.calledWith(`Droplet #1 = ${droplet1.name}`));
  t.assert(infoStub.calledWith(`Droplet #2 = ${droplet2.name}`));
  t.assert(infoStub.calledWith(
    `Removing Tags: ${[ tagSet.green, tagSet.blue ].join(', ')}`
  ));
  t.assert(infoStub.neverCalledWith(
    `Removing GREEN Floating IP Assignment, IP = ${config.ipGreen.ip}`
  ));
  t.assert(infoStub.calledWith(
    `Removing BLUE Floating IP Assignment, IP = ${config.ipBlue.ip}`
  ));
  t.assert(infoStub.calledWith(
    `PROMOTING ${droplet2.name} (ID=${droplet2.id}) to GREEN, IP=${config.ipGreen.ip}`
  ));
  t.assert(infoStub.calledWith(
    `DEMOTING ${droplet1.name} (ID=${droplet1.id}) to BLUE, IP=${config.ipBlue.ip}`
  ));
});

test('It should assign droplet2 to green and droplet1 to blue when only the green IP is assigned to droplet1', async (t) => {
    const droplet1 = {
      id: 'test-droplet-1',
      name: 'test-droplet-1-name',
    };
    const droplet2 = {
      id: 'test-droplet-2',
      name: 'test-droplet-2-name',
    };

  const config = {
    dropletPairTag: 'test-environment',
    droplet1,
    droplet2,
    ipGreen: {
      ip: '10.1.1.1',
      droplet: droplet1,
    },
    ipBlue: {
      ip: '10.1.1.2',
    },
    tagSet,
    expectedAssignments: {
      green: droplet2,
      blue: droplet1,
    },
  };

  const infoStub = Sinon.stub().returns(null);
  const inputStub = InputStub.full(config);

  const core = {
    info: infoStub,
    getInput: inputStub,
  };
  
  const httpClientFactory = HttpClientFactory.success(config);

  await Step.run({ core, httpClientFactory, tagSet, timeout });

  t.assert(infoStub.calledWith(`Droplet #1 = ${droplet1.name}`));
  t.assert(infoStub.calledWith(`Droplet #2 = ${droplet2.name}`));
  t.assert(infoStub.calledWith(
    `Removing Tags: ${[ tagSet.green, tagSet.blue ].join(', ')}`
  ));
  t.assert(infoStub.calledWith(
    `Removing GREEN Floating IP Assignment, IP = ${config.ipGreen.ip}`
  ));
  t.assert(infoStub.neverCalledWith(
    `Removing BLUE Floating IP Assignment, IP = ${config.ipBlue.ip}`
  ));
  t.assert(infoStub.calledWith(
    `PROMOTING ${droplet2.name} (ID=${droplet2.id}) to GREEN, IP=${config.ipGreen.ip}`
  ));
  t.assert(infoStub.calledWith(
    `DEMOTING ${droplet1.name} (ID=${droplet1.id}) to BLUE, IP=${config.ipBlue.ip}`
  ));
});

test('It should assign droplet1 to green and droplet2 to blue when only the blue IP is assigned to droplet1', async (t) => {
    const droplet1 = {
      id: 'test-droplet-1',
      name: 'test-droplet-1-name',
    };
    const droplet2 = {
      id: 'test-droplet-2',
      name: 'test-droplet-2-name',
    };

  const config = {
    dropletPairTag: 'test-environment',
    droplet1,
    droplet2,
    ipGreen: {
      ip: '10.1.1.1',
    },
    ipBlue: {
      ip: '10.1.1.2',
      droplet: droplet1,
    },
    tagSet,
    expectedAssignments: {
      green: droplet1,
      blue: droplet2,
    },
  };

  const infoStub = Sinon.stub().returns(null);
  const inputStub = InputStub.full(config);

  const core = {
    info: infoStub,
    getInput: inputStub,
  };
  
  const httpClientFactory = HttpClientFactory.success(config);

  await Step.run({ core, httpClientFactory, tagSet, timeout });

  t.assert(infoStub.calledWith(`Droplet #1 = ${droplet1.name}`));
  t.assert(infoStub.calledWith(`Droplet #2 = ${droplet2.name}`));
  t.assert(infoStub.calledWith(
    `Removing Tags: ${[ tagSet.green, tagSet.blue ].join(', ')}`
  ));
  t.assert(infoStub.neverCalledWith(
    `Removing GREEN Floating IP Assignment, IP = ${config.ipGreen.ip}`
  ));
  t.assert(infoStub.calledWith(
    `Removing BLUE Floating IP Assignment, IP = ${config.ipBlue.ip}`
  ));
  t.assert(infoStub.calledWith(
    `PROMOTING ${droplet1.name} (ID=${droplet1.id}) to GREEN, IP=${config.ipGreen.ip}`
  ));
  t.assert(infoStub.calledWith(
    `DEMOTING ${droplet2.name} (ID=${droplet2.id}) to BLUE, IP=${config.ipBlue.ip}`
  ));
});

test('It should assign droplet1 to green and droplet2 to blue when only the green IP is assigned to droplet2', async (t) => {
    const droplet1 = {
      id: 'test-droplet-1',
      name: 'test-droplet-1-name',
    };
    const droplet2 = {
      id: 'test-droplet-2',
      name: 'test-droplet-2-name',
    };

  const config = {
    dropletPairTag: 'test-environment',
    droplet1,
    droplet2,
    ipGreen: {
      ip: '10.1.1.1',
      droplet: droplet2,
    },
    ipBlue: {
      ip: '10.1.1.2',
    },
    tagSet,
    expectedAssignments: {
      green: droplet1,
      blue: droplet2,
    },
  };

  const infoStub = Sinon.stub().returns(null);
  const inputStub = InputStub.full(config);

  const core = {
    info: infoStub,
    getInput: inputStub,
  };
  
  const httpClientFactory = HttpClientFactory.success(config);

  await Step.run({ core, httpClientFactory, tagSet, timeout });

  t.assert(infoStub.calledWith(`Droplet #1 = ${droplet1.name}`));
  t.assert(infoStub.calledWith(`Droplet #2 = ${droplet2.name}`));
  t.assert(infoStub.calledWith(
    `Removing Tags: ${[ tagSet.green, tagSet.blue ].join(', ')}`
  ));
  t.assert(infoStub.calledWith(
    `Removing GREEN Floating IP Assignment, IP = ${config.ipGreen.ip}`
  ));
  t.assert(infoStub.neverCalledWith(
    `Removing BLUE Floating IP Assignment, IP = ${config.ipBlue.ip}`
  ));
  t.assert(infoStub.calledWith(
    `PROMOTING ${droplet1.name} (ID=${droplet1.id}) to GREEN, IP=${config.ipGreen.ip}`
  ));
  t.assert(infoStub.calledWith(
    `DEMOTING ${droplet2.name} (ID=${droplet2.id}) to BLUE, IP=${config.ipBlue.ip}`
  ));
});
