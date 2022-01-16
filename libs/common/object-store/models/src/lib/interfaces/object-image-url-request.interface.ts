import { IBucketDetails } from "./bucket-details.interface";

export interface IObjectImageUrlRequest {
    bucketInfo: IBucketDetails;
    fileName: string;
    urlExpiryTime: number;
}