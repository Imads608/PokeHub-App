import { useCheckUsername } from './useCheckUsername';
import { withAuthRetry } from '@pokehub/frontend/pokehub-data-provider';
import { useAuthSession } from '@pokehub/frontend/shared-auth';
import { getFetchClient } from '@pokehub/frontend/shared-data-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

// Mock dependencies
jest.mock('@pokehub/frontend/shared-auth', () => ({
  useAuthSession: jest.fn(),
}));

jest.mock('@pokehub/frontend/pokehub-data-provider', () => ({
  withAuthRetry: jest.fn(),
}));

jest.mock('@pokehub/frontend/shared-data-provider', () => ({
  getFetchClient: jest.fn(),
}));

const mockUseAuthSession = useAuthSession as jest.Mock;
const mockWithAuthRetry = withAuthRetry as jest.Mock;
const mockGetFetchClient = getFetchClient as jest.Mock;

describe('useCheckUsername', () => {
  let queryClient: QueryClient;
  const mockAccessToken = 'mock-access-token';
  const mockFetchThrowsError = jest.fn();

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    jest.clearAllMocks();

    // Default mock: authenticated session with access token
    mockUseAuthSession.mockReturnValue({
      data: { accessToken: mockAccessToken },
      status: 'authenticated',
    });

    // Default mock: getFetchClient returns fetch client with fetchThrowsError
    mockGetFetchClient.mockReturnValue({
      fetchThrowsError: mockFetchThrowsError,
    });

    // Default mock: withAuthRetry passes through to the callback
    mockWithAuthRetry.mockImplementation(async (token, callback) => {
      return callback(token);
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should be disabled when username is empty', () => {
    const { result } = renderHook(() => useCheckUsername(''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
    expect(mockFetchThrowsError).not.toHaveBeenCalled();
  });

  it('should make HEAD request when username is provided', async () => {
    mockFetchThrowsError.mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useCheckUsername('testuser'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGetFetchClient).toHaveBeenCalledWith('API');
    expect(mockWithAuthRetry).toHaveBeenCalledWith(
      mockAccessToken,
      expect.any(Function)
    );
  });

  it('should call fetchThrowsError with correct URL and options', async () => {
    mockFetchThrowsError.mockResolvedValue({ ok: true });

    renderHook(() => useCheckUsername('myusername'), { wrapper });

    await waitFor(() => {
      expect(mockFetchThrowsError).toHaveBeenCalledWith(
        '/users/myusername?dataType=username',
        {
          method: 'HEAD',
          headers: { Authorization: `Bearer ${mockAccessToken}` },
        }
      );
    });
  });

  it('should return null when username exists (200 response)', async () => {
    mockFetchThrowsError.mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useCheckUsername('existinguser'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });

  it('should throw error when username does not exist (404 response)', async () => {
    const notFoundError = new Error('Not Found');
    mockFetchThrowsError.mockRejectedValue(notFoundError);

    const { result } = renderHook(() => useCheckUsername('newusername'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });

  it('should have correct query key structure', async () => {
    mockFetchThrowsError.mockResolvedValue({ ok: true });

    renderHook(() => useCheckUsername('querytest'), { wrapper });

    await waitFor(() => {
      const queryState = queryClient.getQueryState([
        'users',
        'querytest',
        { queryType: 'availability', dataType: 'username' },
      ]);
      expect(queryState).toBeDefined();
    });
  });

  it('should not retry on failure', async () => {
    const error = new Error('Request failed');
    mockFetchThrowsError.mockRejectedValue(error);

    const { result } = renderHook(() => useCheckUsername('failuser'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Check that fetchThrowsError was only called once (no retries)
    expect(mockFetchThrowsError).toHaveBeenCalledTimes(1);
  });

  it('should not make request when not authenticated', async () => {
    mockUseAuthSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    renderHook(() => useCheckUsername('testuser'), { wrapper });

    // Give it a moment to potentially make a call
    await new Promise((resolve) => setTimeout(resolve, 100));

    // withAuthRetry should not be called when there's no access token
    expect(mockWithAuthRetry).not.toHaveBeenCalled();
  });

  it('should refetch when username changes', async () => {
    mockFetchThrowsError.mockResolvedValue({ ok: true });

    const { result, rerender } = renderHook(
      ({ username }) => useCheckUsername(username),
      {
        wrapper,
        initialProps: { username: 'user1' },
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetchThrowsError).toHaveBeenCalledWith(
      '/users/user1?dataType=username',
      expect.any(Object)
    );

    // Clear previous calls
    mockFetchThrowsError.mockClear();

    // Change username
    rerender({ username: 'user2' });

    await waitFor(() => {
      expect(mockFetchThrowsError).toHaveBeenCalledWith(
        '/users/user2?dataType=username',
        expect.any(Object)
      );
    });
  });

  it('should handle network errors', async () => {
    const networkError = new Error('Network error');
    mockFetchThrowsError.mockRejectedValue(networkError);

    const { result } = renderHook(() => useCheckUsername('testuser'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(networkError);
  });
});
