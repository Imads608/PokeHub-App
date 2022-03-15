import { PutObjectRequest, ObjectImageUrlRequest } from "@pokehub/common/object-store/models";

export const S3_SERVICE = 'S3 SERVICE';

export interface IS3Service {
    /**
     * Uploads an Object to S3 given an Object containing the Bucket Location and the File Data
     * @param request The Request Object containing details on where the file should be uploaded in S3
     */
    putObject(request: PutObjectRequest): Promise<void>;

    /**
     * Generates a URL for the Image Resource having an expiry configured in the request itself
     * @param request The Request Object containing details on where the file is located in S3 and how the long URL should be valid for.
     * @returns A string representing the URL
     */
    getUrlForImageObject(request: ObjectImageUrlRequest): string
}