export class UserServiceRESTEndpoints {
    
    static getUserAvatarEndpoint(userId: string): string {
        return `/${userId}/avatar`;
    }
}