export interface FetchClient {
  fetchApi<Data>(input: RequestInfo | URL, init?: RequestInit | undefined): Promise<FetchResponse<Data>>;
  fetchThrowsError<Data>(input: RequestInfo | URL, init?: RequestInit | undefined): Promise<FetchResponse<Data>>;
  setAuthorizationHeader(token: string): void;
}

export interface FetchResponse<Data> extends Response {
  json(): Promise<Data>;
}

export class FetchError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export interface AppFetchClients {
  [key: string]: FetchClient;
}

const BACKEND_URL = process.env['BACKEND_URL'] || 'http://localhost:3000';

const clients: AppFetchClients = {};

export const createFetchClient = (key: string, host: string): FetchClient => {
  const url = new URL(host).toString().replace(/\/$/, ''); // remove the last backslash
  let accessToken = '';

  const fetchClient = {
    fetchApi: async <Data>(apiPath: string, init?: RequestInit | undefined): Promise<FetchResponse<Data>> => {
      const res = await fetch(`${url}${apiPath}`, {
        ...init,
        headers: { Authorization: accessToken, ...init?.headers },
      });

      return res;
    },
    fetchThrowsError: async <Data>(apiPath: string, init?: RequestInit | undefined): Promise<FetchResponse<Data>> => {
      const res = await fetchClient.fetchApi<Data>(apiPath, init);
      if (!res.ok || (res.status !== 200 && res.status !== 201)) {
        throw new FetchError('Error fetching data', res.status);
      }
      return res;
    },
    setAuthorizationHeader: (token: string) => {
      accessToken = token;
    },
  };

  clients[key] = fetchClient;

  return fetchClient;
};

export const getFetchClient = (key: string): FetchClient => {
  return clients[key] || createFetchClient(key, BACKEND_URL);
};
