const { TestHttpClient, TestHttpStore } = require('./http-client');
const Droplet = require('../../lib/droplet.js');

const success = (config) => (options)  => {
  const store = new TestHttpStore();

  const {
    dropletPairTag,
    droplet1,
    droplet2,
    ipGreen,
    ipBlue,
    tagSet,
    expectedAssignments,
  } = config;

  store.expectReq({
    verb: 'GET',
    path: '/droplets',
    query: {
      per_page: '200',
      page: '1',
      tag_name: dropletPairTag,
    },
    reply: {
      status: 200,
      body: { droplets: [ droplet1, droplet2 ] },
    },
  });

  // Green IP get request, currently mapped to droplet-1
  store.expectReq({
    verb: 'GET',
    path: `/floating_ips/${ipGreen.ip}`,
    reply: {
      status: 200,
      body: { floating_ip: ipGreen, },
    },
  });

  // Blue IP get request, currently mapped to droplet-2
  store.expectReq({
    verb: 'GET',
    path: `/floating_ips/${ipBlue.ip}`,
    reply: {
      status: 200,
      body: { floating_ip: ipBlue, },
    },
  });

  // REMOVE TAGS CALLS
  const resourceDroplet1 = Droplet.toResource(droplet1);
  const resourceDroplet2 = Droplet.toResource(droplet2);

  Object.keys(tagSet).forEach((key) => {
    store.expectReq({
      verb: 'DELETE',
      path: `/tags/${tagSet[key]}/resources`,
      data: { resources: [ resourceDroplet1, resourceDroplet2 ] },
      reply: {
        status: 204,
        body: null,
      }
    });

    store.expectReq({
      verb: 'DELETE',
      path: `/tags/${tagSet[key]}/resources`,
      data: { resources: [ resourceDroplet2, resourceDroplet2 ] },
      reply: {
        status: 204,
        body: null,
      },
    });
  });

  store.expectReq({
    verb: 'POST',
    path: `/tags/${tagSet.green}/resources`,
    data: { resources: [ Droplet.toResource(expectedAssignments.green) ] },
    reply: {
      status: 204,
      body: null,
    },
  });

  store.expectReq({
    verb: 'POST',
    path: `/tags/${tagSet.blue}/resources`,
    data: { resources: [ Droplet.toResource(expectedAssignments.blue) ] },
    reply: {
      status: 204,
      body: null,
    },
  });

  store.expectReq({
    verb: 'POST',
    path: `/floating_ips/${ipGreen.ip}/actions`,
    data: { type: 'unassign' },
    reply: {
      status: 201,
      body: null,
    },
  });

  store.expectReq({
    verb: 'POST',
    path: `/floating_ips/${ipBlue.ip}/actions`,
    data: { type: 'unassign' },
    reply: {
      status: 201,
      body: null,
    },
  });

  store.expectReq({
    verb: 'POST',
    path: `/floating_ips/${ipGreen.ip}/actions`,
    data: { type: 'assign', droplet_id: expectedAssignments.green.id },
    reply: {
      status: 201,
      body: null,
    },
  });

  store.expectReq({
    verb: 'POST',
    path: `/floating_ips/${ipBlue.ip}/actions`,
    data: { type: 'assign', droplet_id: expectedAssignments.blue.id },
    reply: {
      status: 201,
      body: null,
    },
  });

  return new TestHttpClient(store, options);
};

module.exports = {
  success,
};
