import { UserData, IUserData } from "@pokehub/user";

export interface UserDetails {
    user: IUserData,
    accessToken: string,
    refreshToken: string,
    joinedPublicRooms: any[]
}