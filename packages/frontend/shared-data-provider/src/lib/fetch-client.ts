export interface FetchClient {
  fetchApi<Data>(
    input: RequestInfo | URL,
    init?: RequestInit | undefined
  ): Promise<FetchResponse<Data | FetchError>>;
  fetchThrowsError<Data>(
    input: RequestInfo | URL,
    init?: RequestInit | undefined
  ): Promise<FetchResponseNoError<Data>>;
}

export type AppFetchClientKeys = 'API' | 'NEXT_API';

export interface FetchError {
  message: string;
}

export class FetchApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export interface FetchResponse<Data> extends Response {
  json(): Promise<Data>;
}

export interface FetchResponseNoError<Data> extends Response {
  json(): Promise<Data>;
}

export interface AppFetchClients {
  [key: string]: FetchClient;
}

const BACKEND_URL = process.env['BACKEND_URL'] || 'http://localhost:3000/api';

const clients: AppFetchClients = {};

export const createFetchClient = (
  key: AppFetchClientKeys,
  host: string
): FetchClient => {
  if (clients[key]) {
    return clients[key];
  }

  const url = new URL(host).toString().replace(/\/$/, ''); // remove the last backslash

  const fetchClient: FetchClient = {
    fetchApi: async <Data>(
      apiPath: string,
      init?: RequestInit | undefined
    ): Promise<FetchResponse<Data | FetchError>> => {
      const res = await fetch(`${url}${apiPath}`, {
        ...init,
        headers: {
          ...init?.headers,
          'x-traceId': crypto.randomUUID(),
          'Content-Type': 'application/json',
        },
      });

      return res;
    },
    fetchThrowsError: async <Data>(
      apiPath: string,
      init?: RequestInit | undefined
    ): Promise<FetchResponseNoError<Data>> => {
      const res = await fetch(`${url}${apiPath}`, {
        ...init,
        headers: {
          ...init?.headers,
          'x-traceId': crypto.randomUUID(),
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok || (res.status !== 200 && res.status !== 201)) {
        if (init?.method === 'HEAD') {
          throw new FetchApiError('HEAD request failed', res.status);
        }
        const jsonRes = await res.json();
        console.log(`Error fetching ${apiPath}:`, jsonRes);
        const err = jsonRes as FetchApiError;
        throw err;
      }
      return res;
    },
  };

  clients[key] = fetchClient;

  return fetchClient;
};

export const doesClientExist = (key: AppFetchClientKeys): boolean =>
  !!clients[key];

export const getFetchClient = (key: AppFetchClientKeys): FetchClient => {
  return clients[key] || createFetchClient(key, BACKEND_URL);
};
