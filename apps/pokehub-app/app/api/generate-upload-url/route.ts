import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
} from '@azure/storage-blob';
import { auth } from '@pokehub/frontend/shared-auth/server';
import type { FetchApiError } from '@pokehub/frontend/shared-data-provider';
import { getLogger } from '@pokehub/frontend/shared-logger/server';
import type { BlobStorageResponse } from '@pokehub/frontend/shared-types';
import { isValidAvatarFileName } from '@pokehub/frontend/shared-utils/server';
import { type NextRequest, NextResponse } from 'next/server';

const AZURE_STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const AZURE_STORAGE_ACCOUNT_KEY = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const CONTAINER_NAME = 'avatars';

if (!AZURE_STORAGE_ACCOUNT_NAME || !AZURE_STORAGE_ACCOUNT_KEY) {
  throw new Error('Azure Storage account name or key is not configured');
}

const sharedKeyCredential = new StorageSharedKeyCredential(
  AZURE_STORAGE_ACCOUNT_NAME,
  AZURE_STORAGE_ACCOUNT_KEY
);

const blobServiceClient = new BlobServiceClient(
  `https://${AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
  sharedKeyCredential
);

const logger = getLogger('GenerateUploadUrl');

export async function POST(req: NextRequest) {
  try {
    logger.info('Generating upload url: ', blobServiceClient.url);

    const session = await auth();
    if (!session?.accessToken || !session?.user) {
      logger.error('Unauthorized access');
      return NextResponse.json<FetchApiError>({
        message: 'Unauthorized',
        status: 401,
        name: 'FetchApiError',
      });
    }

    const { fileName, fileType } = await req.json();
    const fileExtension = fileName.slice(fileName.lastIndexOf('.'));

    logger.info('Successfully parsed request body. Validating file name...');
    if (!isValidAvatarFileName(fileName)) {
      logger.error('Invalid fileName');
      return NextResponse.json<FetchApiError>({
        message: 'Invalid fileName',
        status: 400,
        name: 'FetchApiError',
      });
    }
    if (!fileName || !fileType) {
      logger.error('fileName or fileType is missing');
      return NextResponse.json<FetchApiError>({
        message: 'fileName and fileType are required',
        status: 400,
        name: 'FetchApiError',
      });
    }

    logger.info('Proceessing file upload request');

    const containerClient =
      blobServiceClient.getContainerClient(CONTAINER_NAME);
    await containerClient.createIfNotExists();

    logger.info('Container client created or already exists');

    const userId = session.user.id;
    const blobName = `${userId}/avatar${fileExtension}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: CONTAINER_NAME,
        blobName: blobName,
        permissions: BlobSASPermissions.parse('w'), // Write permissions
        startsOn: new Date(),
        expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // 1 hour expiry
      },
      sharedKeyCredential
    ).toString();

    const uploadUrl = `${blockBlobClient.url}?${sasToken}`;

    logger.info('Generated upload URL successfully');

    const res: BlobStorageResponse = {
      uploadUrl,
      blobUrl: blockBlobClient.url,
    };

    return NextResponse.json(res);
  } catch (error) {
    logger.error({ error }, 'Error generating SAS URL');
    return NextResponse.json<FetchApiError>({
      message: 'Failed to generate upload URL',
      status: 500,
      name: 'FetchApiError',
    });
  }
}
