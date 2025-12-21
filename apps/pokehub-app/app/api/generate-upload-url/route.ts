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

const CONTAINER_NAME = 'avatars';

const logger = getLogger('GenerateUploadUrl');

/**
 * E2E Testing Support
 *
 * When E2E_TESTING=true, returns mock URLs instead of real Azure Blob Storage URLs.
 * The mock upload URL points to the MSW proxy server which accepts the upload.
 * The mock blob URL points to a static test avatar served by the proxy.
 */
const MSW_PROXY_URL = 'http://localhost:9876';

function getAzureClients() {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || 'pokehub';
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

  if (!accountName || !accountKey) {
    throw new Error('Azure Storage account name or key is not configured');
  }

  const sharedKeyCredential = new StorageSharedKeyCredential(
    accountName,
    accountKey
  );

  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    sharedKeyCredential
  );

  return { sharedKeyCredential, blobServiceClient };
}

export async function POST(req: NextRequest) {
  const isE2ETesting = process.env.E2E_TESTING === 'true';

  try {
    // Check auth first (applies to both E2E and production)
    const session = await auth();
    if (!session?.accessToken || !session?.user) {
      logger.error('Unauthorized access');
      return NextResponse.json<FetchApiError>(
        {
          message: 'Unauthorized',
          status: 401,
          name: 'FetchApiError',
        },
        { status: 401 }
      );
    }

    const { fileName, fileType } = await req.json();
    const fileExtension = fileName.slice(fileName.lastIndexOf('.'));

    logger.info('Successfully parsed request body. Validating file name...');
    if (!isValidAvatarFileName(fileName)) {
      logger.error('Invalid fileName');
      return NextResponse.json<FetchApiError>(
        {
          message: 'Invalid fileName',
          status: 400,
          name: 'FetchApiError',
        },
        { status: 400 }
      );
    }
    if (!fileName || !fileType) {
      logger.error('fileName or fileType is missing');
      return NextResponse.json<FetchApiError>(
        {
          message: 'fileName and fileType are required',
          status: 400,
          name: 'FetchApiError',
        },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // E2E Testing: Return mock URLs pointing to MSW proxy server
    if (isE2ETesting) {
      logger.info('E2E Testing mode: returning mock upload URLs');
      const res: BlobStorageResponse = {
        uploadUrl: `${MSW_PROXY_URL}/mock-azure-upload`,
        blobUrl: `${MSW_PROXY_URL}/mock-avatars/${userId}/avatar${fileExtension}`,
      };
      return NextResponse.json(res);
    }

    // Production: Use real Azure Blob Storage
    const { sharedKeyCredential, blobServiceClient } = getAzureClients();
    logger.info(`Generating upload url: ${blobServiceClient.url} `);

    logger.info('Processing file upload request');

    const containerClient =
      blobServiceClient.getContainerClient(CONTAINER_NAME);
    await containerClient.createIfNotExists();

    logger.info('Container client created or already exists');

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
    return NextResponse.json<FetchApiError>(
      {
        message: 'Failed to generate upload URL',
        status: 500,
        name: 'FetchApiError',
      },
      { status: 500 }
    );
  }
}
