import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppLogger } from "@pokehub/common/logger";
import { IS3Service, S3_SERVICE } from "@pokehub/common/object-store";
import { BucketDetails, ImageContentTypes, ObjectImageUrlRequest, PutObjectRequest } from "@pokehub/common/object-store/models";
import { UserData } from "@pokehub/user/models";
import { IUtilsService } from "./utils-interface.service";

@Injectable()
export class UtilsService implements IUtilsService {
    constructor(private readonly logger: AppLogger, @Inject(S3_SERVICE) private readonly objectStoreService: IS3Service, private readonly configService: ConfigService) {
        this.logger.setContext(UtilsService.name);
    }

    populateAvatarURL(userData: UserData): void {
        this.logger.log(`populateAvatarURL: Creating url for user with details: ${JSON.stringify(userData.avatar)}`);
        if (!userData.avatar) {
            this.logger.log(`populateAvatarURL: No Avatar found for user. Skipping...`);
            return;
        }
        userData.avatarUrl = this.objectStoreService.getUrlForImageObject(new ObjectImageUrlRequest(new BucketDetails(userData.avatar.bucketName, userData.avatar.objectPath)
                                                                    , 'avatar.png', 900));
    }

    async saveNewAvatar(userId: string, avatarData: Buffer): Promise<BucketDetails> {
        this.logger.log(`saveNewAvatar: Uploading and save User avatar for ${userId}`);
        const putRequest = new PutObjectRequest(new BucketDetails(this.configService.get<string>('awsConfig.userBucketName'), 
                                                `${userId}/avatar`), 'avatar.png', avatarData, ImageContentTypes.IMAGE_JPEG);
        await this.objectStoreService.putObject(putRequest);
        return putRequest.bucketInfo;
    }
}