import { useAvatarUpload } from './use-avatar-upload';
import { getFetchClient } from '@pokehub/frontend/shared-data-provider';
import { isValidAvatarFileName } from '@pokehub/frontend/shared-utils';
import { renderHook, act } from '@testing-library/react';

// Mock dependencies
jest.mock('@pokehub/frontend/shared-data-provider', () => ({
  getFetchClient: jest.fn(),
  FetchApiError: class FetchApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
      this.name = 'FetchApiError';
    }
  },
}));

jest.mock('@pokehub/frontend/shared-utils', () => ({
  isValidAvatarFileName: jest.fn(),
}));

const mockGetFetchClient = getFetchClient as jest.Mock;
const mockIsValidAvatarFileName = isValidAvatarFileName as jest.Mock;

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();

describe('useAvatarUpload', () => {
  const mockFetchThrowsError = jest.fn();
  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup URL mocks
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
    mockCreateObjectURL.mockReturnValue('blob:test-preview-url');

    // Setup fetch client mock
    mockGetFetchClient.mockReturnValue({
      fetchThrowsError: mockFetchThrowsError,
    });

    // Setup global fetch mock for Azure upload
    global.fetch = mockFetch;

    // Default: valid file names
    mockIsValidAvatarFileName.mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useAvatarUpload());

      expect(result.current.selectedFile).toBeNull();
      expect(result.current.previewUrl).toBeNull();
      expect(result.current.isUploading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should provide all required functions', () => {
      const { result } = renderHook(() => useAvatarUpload());

      expect(typeof result.current.handleFileSelect).toBe('function');
      expect(typeof result.current.uploadAvatar).toBe('function');
      expect(typeof result.current.clearSelection).toBe('function');
    });
  });

  describe('handleFileSelect', () => {
    it('should set selectedFile and previewUrl for valid file', () => {
      const { result } = renderHook(() => useAvatarUpload());

      const file = new File(['test content'], 'avatar.png', {
        type: 'image/png',
      });
      const event = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleFileSelect(event);
      });

      expect(result.current.selectedFile).toBe(file);
      expect(result.current.previewUrl).toBe('blob:test-preview-url');
      expect(mockCreateObjectURL).toHaveBeenCalledWith(file);
      expect(result.current.error).toBeNull();
    });

    it('should set error for invalid file type', () => {
      mockIsValidAvatarFileName.mockReturnValue(false);

      const { result } = renderHook(() => useAvatarUpload());

      const file = new File(['test'], 'document.pdf', {
        type: 'application/pdf',
      });
      const event = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleFileSelect(event);
      });

      expect(result.current.error).toBe(
        'Invalid file type. Please use .png, .jpg, .jpeg, or .gif'
      );
      expect(result.current.selectedFile).toBeNull();
      expect(result.current.previewUrl).toBeNull();
    });

    it('should call onError callback for invalid file', () => {
      mockIsValidAvatarFileName.mockReturnValue(false);

      const onError = jest.fn();
      const { result } = renderHook(() => useAvatarUpload({ onError }));

      const file = new File(['test'], 'bad.exe', {
        type: 'application/x-executable',
      });
      const event = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleFileSelect(event);
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid file type. Please use .png, .jpg, .jpeg, or .gif',
        })
      );
    });

    it('should revoke previous preview URL to prevent memory leaks', () => {
      const { result } = renderHook(() => useAvatarUpload());

      // Select first file
      const file1 = new File(['test1'], 'avatar1.png', { type: 'image/png' });
      act(() => {
        result.current.handleFileSelect({
          target: { files: [file1] },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      const firstPreviewUrl = result.current.previewUrl;
      expect(firstPreviewUrl).toBe('blob:test-preview-url');

      // Select second file
      mockCreateObjectURL.mockReturnValue('blob:second-preview-url');
      const file2 = new File(['test2'], 'avatar2.png', { type: 'image/png' });
      act(() => {
        result.current.handleFileSelect({
          target: { files: [file2] },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      // Previous URL should have been revoked
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-preview-url');
      expect(result.current.previewUrl).toBe('blob:second-preview-url');
    });

    it('should do nothing when no file is selected', () => {
      const { result } = renderHook(() => useAvatarUpload());

      const event = {
        target: { files: [] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleFileSelect(event);
      });

      expect(result.current.selectedFile).toBeNull();
      expect(result.current.previewUrl).toBeNull();
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
    });

    it('should clear previous error when selecting new file', () => {
      mockIsValidAvatarFileName.mockReturnValueOnce(false);

      const { result } = renderHook(() => useAvatarUpload());

      // First, select invalid file
      const invalidFile = new File(['test'], 'bad.exe', {
        type: 'application/x-executable',
      });
      act(() => {
        result.current.handleFileSelect({
          target: { files: [invalidFile] },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.error).not.toBeNull();

      // Now select valid file
      mockIsValidAvatarFileName.mockReturnValue(true);
      const validFile = new File(['test'], 'good.png', { type: 'image/png' });
      act(() => {
        result.current.handleFileSelect({
          target: { files: [validFile] },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('uploadAvatar', () => {
    const mockUploadUrl = 'https://azure.blob.storage/upload?sas=token';
    const mockBlobUrl = 'https://azure.blob.storage/avatars/user/avatar.png';

    beforeEach(() => {
      // Default: successful upload flow
      mockFetchThrowsError.mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          uploadUrl: mockUploadUrl,
          blobUrl: mockBlobUrl,
        }),
      });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
      });
    });

    it('should return null when no file is selected', async () => {
      const { result } = renderHook(() => useAvatarUpload());

      let uploadResult;
      await act(async () => {
        uploadResult = await result.current.uploadAvatar();
      });

      expect(uploadResult).toBeNull();
      expect(mockFetchThrowsError).not.toHaveBeenCalled();
    });

    it('should complete upload flow successfully', async () => {
      const { result } = renderHook(() => useAvatarUpload());

      // Select a file first
      const file = new File(['test content'], 'avatar.png', {
        type: 'image/png',
      });
      act(() => {
        result.current.handleFileSelect({
          target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      let uploadResult;
      await act(async () => {
        uploadResult = await result.current.uploadAvatar();
      });

      // Verify SAS URL was requested
      expect(mockGetFetchClient).toHaveBeenCalledWith('NEXT_API');
      expect(mockFetchThrowsError).toHaveBeenCalledWith(
        '/api/generate-upload-url',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            fileName: 'avatar.png',
            fileType: 'image/png',
          }),
        })
      );

      // Verify Azure upload was made
      expect(mockFetch).toHaveBeenCalledWith(mockUploadUrl, {
        method: 'PUT',
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': 'image/png',
        },
        body: file,
      });

      // Verify result
      expect(uploadResult).toEqual({
        avatarUrl: mockBlobUrl,
        fileName: 'avatar.png',
      });
    });

    it('should set isUploading state during upload', async () => {
      let resolveUpload: (value: unknown) => void;
      const uploadPromise = new Promise((resolve) => {
        resolveUpload = resolve;
      });
      mockFetch.mockReturnValue(uploadPromise);

      const { result } = renderHook(() => useAvatarUpload());

      // Select a file
      const file = new File(['test'], 'avatar.png', { type: 'image/png' });
      act(() => {
        result.current.handleFileSelect({
          target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.isUploading).toBe(false);

      // Start upload
      let uploadPromiseResult: Promise<unknown>;
      act(() => {
        uploadPromiseResult = result.current.uploadAvatar();
      });

      // Should be uploading now
      expect(result.current.isUploading).toBe(true);

      // Complete upload
      await act(async () => {
        resolveUpload!({ ok: true, status: 201 });
        await uploadPromiseResult;
      });

      expect(result.current.isUploading).toBe(false);
    });

    it('should call onUploadComplete callback on success', async () => {
      const onUploadComplete = jest.fn();
      const { result } = renderHook(() =>
        useAvatarUpload({ onUploadComplete })
      );

      // Select a file
      const file = new File(['test'], 'avatar.png', { type: 'image/png' });
      act(() => {
        result.current.handleFileSelect({
          target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.uploadAvatar();
      });

      expect(onUploadComplete).toHaveBeenCalledWith(mockBlobUrl, 'avatar.png');
    });

    it('should set error when SAS URL request fails', async () => {
      mockFetchThrowsError.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAvatarUpload());

      // Select a file
      const file = new File(['test'], 'avatar.png', { type: 'image/png' });
      act(() => {
        result.current.handleFileSelect({
          target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      let uploadResult;
      await act(async () => {
        uploadResult = await result.current.uploadAvatar();
      });

      expect(uploadResult).toBeNull();
      expect(result.current.error).toBe('Network error');
      expect(result.current.isUploading).toBe(false);
    });

    it('should set error when Azure upload fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useAvatarUpload());

      // Select a file
      const file = new File(['test'], 'avatar.png', { type: 'image/png' });
      act(() => {
        result.current.handleFileSelect({
          target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      let uploadResult;
      await act(async () => {
        uploadResult = await result.current.uploadAvatar();
      });

      expect(uploadResult).toBeNull();
      expect(result.current.error).toBe('Failed to upload avatar');
      expect(result.current.isUploading).toBe(false);
    });

    it('should call onError callback when upload fails', async () => {
      mockFetchThrowsError.mockRejectedValue(new Error('Upload failed'));

      const onError = jest.fn();
      const { result } = renderHook(() => useAvatarUpload({ onError }));

      // Select a file
      const file = new File(['test'], 'avatar.png', { type: 'image/png' });
      act(() => {
        result.current.handleFileSelect({
          target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.uploadAvatar();
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Upload failed',
        })
      );
    });
  });

  describe('clearSelection', () => {
    it('should reset all state', () => {
      const { result } = renderHook(() => useAvatarUpload());

      // First, select a file
      const file = new File(['test'], 'avatar.png', { type: 'image/png' });
      act(() => {
        result.current.handleFileSelect({
          target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.selectedFile).not.toBeNull();
      expect(result.current.previewUrl).not.toBeNull();

      // Clear selection
      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedFile).toBeNull();
      expect(result.current.previewUrl).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should revoke preview URL to prevent memory leaks', () => {
      const { result } = renderHook(() => useAvatarUpload());

      // Select a file
      const file = new File(['test'], 'avatar.png', { type: 'image/png' });
      act(() => {
        result.current.handleFileSelect({
          target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      const previewUrl = result.current.previewUrl;

      // Clear selection
      act(() => {
        result.current.clearSelection();
      });

      expect(mockRevokeObjectURL).toHaveBeenCalledWith(previewUrl);
    });

    it('should not call revokeObjectURL if no preview exists', () => {
      const { result } = renderHook(() => useAvatarUpload());

      // Clear without selecting anything first
      act(() => {
        result.current.clearSelection();
      });

      expect(mockRevokeObjectURL).not.toHaveBeenCalled();
    });

    it('should clear error state', () => {
      mockIsValidAvatarFileName.mockReturnValue(false);

      const { result } = renderHook(() => useAvatarUpload());

      // Create an error by selecting invalid file
      const file = new File(['test'], 'bad.exe', {
        type: 'application/x-executable',
      });
      act(() => {
        result.current.handleFileSelect({
          target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.error).not.toBeNull();

      // Clear selection
      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
