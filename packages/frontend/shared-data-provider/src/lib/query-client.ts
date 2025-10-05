import { QueryClient } from '@tanstack/react-query';

export const createQueryClient = () => {
  return new QueryClient();
};

let serverQueryClient: QueryClient;

export const getServerQueryClient = () => {
  if (serverQueryClient) {
    return serverQueryClient;
  }
  serverQueryClient = new QueryClient();
  return serverQueryClient;
};
