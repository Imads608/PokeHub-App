import { Injectable } from "@nestjs/common";
import { AppLogger } from "@pokehub/common/logger";
import { PutObjectRequest, ObjectImageUrlRequest } from "@pokehub/common/object-store/models";
import { AWSError, S3 } from 'aws-sdk';
import { PromiseResult } from "aws-sdk/lib/request";
import { InjectAwsService } from 'nest-aws-sdk';
import { IS3Service } from "./s3-service.interface";

@Injectable()
export class S3Service implements IS3Service {
    constructor(private readonly logger: AppLogger, @InjectAwsService(S3) private readonly s3: S3) {
        logger.setContext(S3Service.name);
    }

    async putObject(request: PutObjectRequest): Promise<void> {
        try {
            this.logger.log(`putObject: Got request to put object with file name ${request.keyName} into S3 Bucket ${request.bucketInfo.bucketName}`);
            await this.s3.putObject({ Bucket: `${request.bucketInfo.bucketName}/${request.bucketInfo.objectPath}`, 
                                      Key: request.keyName, Body: request.fileBuffer, ContentType: request.contentType }).promise();
            /*const url = this.s3.getSignedUrl('getObject', {
                Key: request.fileName,
                Bucket: `${request.bucketInfo.bucketName}/${request.bucketInfo.objectPath}`,
                Expires: 900
            });*/
            this.logger.log(`putObject: Successfully uploaded object with file name ${request.keyName} into S3 Bucket ${request.bucketInfo.bucketName}`);
        } catch (err) {
            this.logger.error(`Got error while trying to put object with details file name ${request.keyName} into S3 Bucket ${request.bucketInfo.bucketName}: ${(<Error>err).message}`, (<Error>err).stack);
            throw err;
        }
    }

    getUrlForImageObject(request: ObjectImageUrlRequest): string {
        try {
            this.logger.log(`getUrlForImageObject: Generating URL for Image with Key: ${request.fileName}, Bucket: ${request.bucketInfo.bucketName}/${request.bucketInfo.objectPath}`);
            return this.s3.getSignedUrl('getObject', {
                Key: request.fileName,
                Bucket: `${request.bucketInfo.bucketName}/${request.bucketInfo.objectPath}`,
                Expires: request.urlExpiryTime
            });
        } catch (err) {
            this.logger.error(`Got error while trying to retrieve signed URL for request ${JSON.stringify(request)}: ${(<Error>err).message}`, (<Error>err).stack);
            throw err;
        }
    }
}