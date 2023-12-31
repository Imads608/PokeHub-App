import { BucketDetails } from "./bucket-details.model";
import { ApplicationContentTypes, AudioContentTypes, BinaryContentTypes, ImageContentTypes, TextContentTypes } from "./content-types.enum";
import { IPutObjectRequest } from "./interfaces/put-object-request.interface";

export class PutObjectRequest implements IPutObjectRequest {
    bucketInfo: BucketDetails;
    keyName: string;
    fileBuffer: Buffer;
    contentType: ImageContentTypes | BinaryContentTypes | ApplicationContentTypes | AudioContentTypes | TextContentTypes;


    constructor(bucketInfo: BucketDetails, keyName: string, fileBuffer: Buffer, contentType: ImageContentTypes | BinaryContentTypes | ApplicationContentTypes | AudioContentTypes | TextContentTypes) {
        this.bucketInfo = bucketInfo;
        this.keyName = keyName;
        this.fileBuffer = fileBuffer;
        this.contentType = contentType;
    }
}