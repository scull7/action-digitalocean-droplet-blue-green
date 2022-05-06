const test = require('ava');
const Tag = require('../lib/tag.js');

test(
  'removeList should send a string for the resource ID when given a number for the resource ID', 
  async (t) => {
    const resources = [
      { resource_id: 12345, resource_type: 'droplet' },
      { resource_id: 67890, resource_type: 'droplet' },
    ]

    const api = {
      del: async (path, parameters) => ({ path, parameters }),
    };

    const actual = await Tag.remove(api, 'test-tag-name', resources);

    t.assert(typeof actual.parameters.resources[0].resource_id === 'string');
    t.is(actual.parameters.resources[0].resource_id, '12345');
    t.is(actual.parameters.resources[0].resource_type, 'droplet');

    t.assert(typeof actual.parameters.resources[1].resource_id === 'string');
    t.is(actual.parameters.resources[1].resource_id, '67890');
    t.is(actual.parameters.resources[1].resource_type, 'droplet');
  },
);
