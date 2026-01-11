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
    this.name = 'FetchApiError';
    // Maintain proper prototype chain
    Object.setPrototypeOf(this, FetchApiError.prototype);
  }
}

export interface FetchResponse<Data> extends Response {
  json(): Promise<Data>;
}

export interface FetchResponseNoError<Data> extends Response {
  json(): Promise<Data>;
}

export type AppFetchClients = {
  [key in AppFetchClientKeys]: FetchClient | undefined;
};

const defaultClientURLs: { [key in AppFetchClientKeys]: string } = {
  API: process.env['API_URL'] || 'http://localhost:3000/api',
  NEXT_API: process.env['NEXT_API_URL'] || 'http://localhost:3000/api',
};

const clients: AppFetchClients = {
  API: undefined,
  NEXT_API: undefined,
};

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
      if (!res.ok || [200, 201, 204].indexOf(res.status) === -1) {
        if (init?.method === 'HEAD') {
          throw new FetchApiError('HEAD request failed', res.status);
        }
        const err = await tryParseJSONError(res);
        console.log(`Error fetching ${apiPath}:`, err);
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
  return clients[key] || createFetchClient(key, defaultClientURLs[key]);
};

const tryParseJSONError = async (res: Response): Promise<FetchApiError> => {
  let message = 'An Error occurred';
  try {
    const jsonRes = await res.json();
    if (jsonRes && typeof jsonRes.message === 'string') {
      message = jsonRes.message;
    }
  } catch {
    // Couldn't parse JSON, use default message
  }

  return new FetchApiError(message, res.status);
};
