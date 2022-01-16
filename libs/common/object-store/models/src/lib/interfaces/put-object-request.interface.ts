import { ApplicationContentTypes, AudioContentTypes, BinaryContentTypes, ImageContentTypes, TextContentTypes } from "../content-types.enum";
import { IBucketDetails } from "./bucket-details.interface";

export interface IPutObjectRequest {
    bucketInfo: IBucketDetails;
    keyName: string;
    fileBuffer: Buffer;
    contentType: ImageContentTypes | BinaryContentTypes | ApplicationContentTypes | AudioContentTypes | TextContentTypes;
}