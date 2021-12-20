import { UserData } from "@pokehub/user";

export interface UserDetails {
    user: UserData,
    accessToken: string,
    refreshToken: string,
    joinedPublicRooms: any[]
}