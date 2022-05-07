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
    verb: 'GET',
    path: `/floating_ips/${ipGreen.ip}/actions`,
    reply: {
      status: 200,
      body: {
        "actions": [
          {
            "id": 72531856,
            "status": "completed",
            "type": "reserve_ip",
            "started_at": "2015-11-21T21:51:09.000Z",
            "completed_at": "2015-11-21T21:51:09.000Z",
            "resource_id": 758604197,
            "resource_type": "floating_ip",
            "region": {
              "name": "New York 3",
              "slug": "nyc3",
              "sizes": [
                "s-1vcpu-1gb",
                "s-1vcpu-2gb",
                "s-1vcpu-3gb",
                "s-2vcpu-2gb",
                "s-3vcpu-1gb",
                "s-2vcpu-4gb",
                "s-4vcpu-8gb",
                "s-6vcpu-16gb",
                "s-8vcpu-32gb",
                "s-12vcpu-48gb",
                "s-16vcpu-64gb",
                "s-20vcpu-96gb",
                "s-24vcpu-128gb",
                "s-32vcpu-192gb"
              ],
              "features": [
                "private_networking",
                "backups",
                "ipv6",
                "metadata"
              ],
              "available": true
            },
            "region_slug": "nyc3"
          }
        ],
        "links": {},
        "meta": {
          "total": 1
        }
      },
    },
  });

  store.expectReq({
    verb: 'GET',
    path: `/floating_ips/${ipBlue.ip}/actions`,
    reply: {
      status: 200,
      body: {
        "actions": [],
        "links": {},
        "meta": {
          "total": 0,
        },
      },
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
