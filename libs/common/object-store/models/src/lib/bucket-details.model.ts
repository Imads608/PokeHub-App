import { IBucketDetails } from "./interfaces/bucket-details.interface";

export class BucketDetails implements IBucketDetails {
    bucketName: string;
    objectPath: string;

    constructor(bucketName: string, objectPath: string) {
        this.bucketName = bucketName;
        this.objectPath = objectPath;
    }
}