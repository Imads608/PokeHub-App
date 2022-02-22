import { IUserStatusData } from '@pokehub/user/interfaces';

export interface IUserStatusEvent {
    status: IUserStatusData
    isHardUpdate: boolean;
}