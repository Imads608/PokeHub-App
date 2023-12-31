import { BucketDetails } from "..";
import { IObjectImageUrlRequest } from "./interfaces/object-image-url-request.interface";

export class ObjectImageUrlRequest implements IObjectImageUrlRequest {
    bucketInfo: BucketDetails;
    fileName: string;
    urlExpiryTime: number;

    constructor(bucketInfo: BucketDetails, fileName: string, urlExpiryTime: number) {
        this.bucketInfo = bucketInfo;
        this.fileName = fileName;
        this.urlExpiryTime = urlExpiryTime;
    }
}