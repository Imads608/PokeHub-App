export class UserRESTGatewayEndpoints {
    
    static getUserAvatarEndpoint(userId: string): string {
        return `/${userId}/avatar`;
    }
}