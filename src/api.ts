import * as Path from 'path';
import { URL, URLSearchParams } from 'url';
import {
  IHttpClient,
  IHttpClientResponse,
  IRequestOptions
} from '@actions/http-client/interfaces';

const DIGITAL_OCEAN_API_DOMAIN = 'api.digitalocean.com';
const DIGITAL_OCEAN_API_PROTOCOL = 'https';
const DIGITAL_OCEAN_API_VERSION = 'v2';

// 204 - response code for tag add /remove
const STATUS_CODES_SUCCESS = [ 200, 201, 202, 204 ];

type PathInput = string | { path: string, query: URLSearchParams };

interface IRequest {
  verb: string,
  url: URL,
  data: object | null,
  headers?: object,
}

type Parser<T> = (x: any) => T;

export interface IApi {
  del(path: PathInput, data: { [key: string]: any }): Promise<void>;

  get<T>(parser: Parser<T>, path: PathInput): Promise<T | null>;

  post<T>(
    parser: Parser<T>,
    path: PathInput,
    data: { [key: string]: any },
  ): Promise<T | null>;
}

export class Api implements IApi {
  baseURL: string;

  client: IHttpClient;

  token: string;
  
  constructor(
    token: string,
    httpClientFactory: (options: IRequestOptions) => IHttpClient
  ) {
    this.token = token;
    this.baseURL = `${DIGITAL_OCEAN_API_PROTOCOL}://${DIGITAL_OCEAN_API_DOMAIN}`;

    this.client = httpClientFactory({
      headers: {
        ["Authorization"]: `Bearer ${this.token}`,
        ["Content-Type"]: "application/json",
      },
    });
  }

  makeUrl(input: PathInput): URL {
    if (typeof input === 'string') {
      const path = Path.join(DIGITAL_OCEAN_API_VERSION, input);

      return new URL(path, this.baseURL);
    }

    const path = Path.join(DIGITAL_OCEAN_API_VERSION, input.path);

    let url = new URL(path, this.baseURL);
    url.search = input.query.toString();

    return url;
  }

  async request<T>(parser: (x: object) => T, req: IRequest): Promise<T | null> {
    const requestUrl = req.url.toString();
    const data = JSON.stringify(req.data);
    const headers = req.headers || {};

    const res = await this.client.request(req.verb, requestUrl, data, headers);

    const body = await parseBody(res);
    const err = getError(req, res, body);

    if (err) {
      throw err;
    }

    if (body) {
      return parser(body);
    }

    return null;
  }
  
  public async del(
    path: PathInput,
    body: { [key: string]: any },
  ): Promise<void> {
    const parser = (x: any): any => x;

    return this.request(parser, {
      verb: 'DELETE',
      url: this.makeUrl(path),
      data: body,
    });
  }
  
  public async get<T>(
    parser: (x: any) => T,
    path: PathInput
  ): Promise<T | null> {
    return this.request(parser, {
      verb: 'GET',
      url: this.makeUrl(path),
      data: null,
    });
  }

  public async post<T>(
    parser: (x: any) => T,
    path: PathInput,
    data: { [key: string]: any },
  ): Promise<T | null> {
    return this.request(parser, {
      verb: 'POST',
      url: this.makeUrl(path),
      data,
    });
  }
}

async function parseBody(res: IHttpClientResponse): Promise<object | null> {
  try {
    let body = await res.readBody();

    if (body == null) {
      return null;
    }

    return JSON.parse(body);

  } catch(error) {
    return {
      id: 'internal::body_parse_error',
      message: error.message,
    };
  }
} 

function getError(
  req: IRequest,
  res: IHttpClientResponse,
  body: { [key: string]: any } | null
): Error | null {
  let statusCode: number = res.message.statusCode || 500;

  if (STATUS_CODES_SUCCESS.includes(statusCode)) {
    return null;
  }

  if (body == null) {
    body = {
      id: 'EMPTY',
      message: 'Body was not present',
    };
  }

  const url = req.url.toString();
  const prefix = body.id ? body.id.toUpperCase() : 'UNKNOWN';
  const message = body.message ? body.message : 'Message was empty';

  return new Error(`${prefix} (${statusCode}): ${url} :: ${message}`);
}
