import { BucketDetails } from "@pokehub/common/object-store/models";
import { UserData } from "@pokehub/user/models";

export const UTILS_SERVICE = "UTILS_SERVICE";

export interface IUtilsService {
    populateAvatarURL(userData: UserData): void;
    saveNewAvatar(userId: string, avatarData: Buffer): Promise<BucketDetails>;
}