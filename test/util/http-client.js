const Assert = require('assert');
const Crypto = require('crypto');
const { URL, URLSearchParams } = require('url');
const { HttpClient } = require('@actions/http-client');
const stableStringify = require('fast-json-stable-stringify');

const URL_BASE = 'https://api.digitalocean.com';

function makeHash(url, body, headers) {
  const hash = Crypto.createHash('sha256').update(url);

  if (body) {
    hash.update(body);
  }

  if (headers) {
    hash.update(stableStringify(headers));
  }

  return hash.digest('hex');
}

function makeReply({ status, body }) {
  return {
    message: {
      statusCode: status,
    },
    readBody: () => Promise.resolve(JSON.stringify(body)),
  };
}

function makeUrl(path, query) {
  const url = new URL(`/v2${path}`, URL_BASE);

  if (query) {
    url.search = new URLSearchParams(query).toString();
  }

  return url.toString();
}

class TestHttpStore {
  constructor() {
    this.store = {
      'DELETE': {},
      'GET': {},
      'POST': {},
    };
  }

  expectReq({ data, verb, path, query, reply }) {
    Assert.ok(this.store[verb], `${verb} method is not supported`);

    const url = makeUrl(path, query);
    const body = JSON.stringify(data || null);
    const headers = {};

    const hash = makeHash(url, body, headers);

    this.store[verb][hash] = reply;

    return;
  }

  async request(verb, url, body, headers) {
    Assert.ok(this.store[verb], `${verb} method is not supported`);

    const hash = makeHash(url, body, headers || {});
    const matched = this.store[verb][hash];

    let bodyString = stableStringify(body);
    let headerString = stableStringify(headers);

    Assert.ok(
      matched,
      `Request Not Found :: VERB=${verb}, URL=${url}, BODY=${bodyString}, HEADERS=${headerString}`
    );

    const reply = makeReply(matched);

    return Promise.resolve(reply);
  }
}

class TestHttpClient extends HttpClient {
  constructor(store, options) {
    super(undefined, undefined, options);

    this.store = store;
  }

  async request(verb, url, body, headers) {
    return this.store.request(verb, url, body, headers);
  }
}

module.exports = { makeUrl, TestHttpClient, TestHttpStore };
