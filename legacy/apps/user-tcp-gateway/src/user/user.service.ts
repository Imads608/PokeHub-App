import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateUserRequest, UserData, UserPublicData, UserStatusData } from '@pokehub/user/models';
import {  EmailLogin } from '@pokehub/auth/models';
import { AppLogger } from '@pokehub/common/logger';
import { IUserService } from './user-service.interface';
import { UserIdTypes } from '@pokehub/user/interfaces';
import { UserServiceTCPEndpoints } from '@pokehub/user/endpoints';

@Injectable()
export class UserService implements IUserService {
    constructor(@Inject('UserInternalService') private readonly clientProxy: ClientProxy, private readonly logger: AppLogger) {
        logger.setContext(UserService.name);
    }

    async createUser(createReq: CreateUserRequest): Promise<UserData> {
        try {
        // Create User
        this.logger.log( `createUser: Sending request to User Service to create User with email ${createReq.email}` );
        const user: UserData = await firstValueFrom( this.clientProxy.send<UserData>({ cmd: UserServiceTCPEndpoints.CREATE_USER }, createReq) );
        if (!user) throw new RpcException('Internal Server Error');

        this.logger.log( `createUser: Successfully created User with email ${createReq.email}` );
        return user;
        } catch (err) {
        this.logger.error( `createUser: Got error while trying to create user with email ${createReq.email}: ${err.message}`, err.stack );
        throw err;
        }
    }

    async googleOAuthLogin(createUser: CreateUserRequest): Promise<UserData> {
        try {
            this.logger.log(`googleOAuthLogin: Sending Request to User Service to Create or Login User with Google OAuth ${createUser.email}`);
            const user: UserData = await firstValueFrom(this.clientProxy.send<UserData>({ cmd: UserServiceTCPEndpoints.GOOGLE_OAUTH_LOGIN }, createUser));
            if (!user) throw new RpcException("Internal Server Error");

            this.logger.log(`googleOAuthLogin: Successfully Created/Logged in User with email ${createUser.email}`);
            return user;
        } catch (err) {
            this.logger.error(`googleOAuthLogin: Got error while trying to login user with email ${createUser.email}: ${err.message}`, err.stack);
            throw err;
        }
    }

    async getPublicUser(uid: string): Promise<UserPublicData> {
        try {
            this.logger.log(`getPublicUser: Sending Request to User Service to retrieve Public Details of User with uid ${uid}`);
            const user = await firstValueFrom(this.clientProxy.send<UserPublicData>({ cmd: UserServiceTCPEndpoints.GET_PUBLIC_USER }, uid));
            this.logger.log(`getPublicUser: Successfully retrieved details of User with uid ${uid}`);
            return user;
        } catch (err) {
            this.logger.error(`getPublicUser: Got error while trying to retrieve public details of user with uid ${uid}: ${err.message}`, err.stack);
            throw err;
        }
    }

    async findUser(uid: string): Promise<UserData> {
        try {
            this.logger.log(`findUser: Sending Request to User Service to retrieve Data of User with uid ${uid}`);
            const user = await firstValueFrom(this.clientProxy.send<UserData>({ cmd: UserServiceTCPEndpoints.FIND_USER }, uid));
            this.logger.log(`findUser: Sucessfully retrieved details of User with uid ${uid}`);
            return user;
        } catch (err) {
            this.logger.error(`findUser: Got error while trying to retrieve Data of User with uid ${uid}: ${err.message}`, err.stack);
            throw err;
        }
    }

    async findUserByEmail(email: string): Promise<UserData> {
        try {
            this.logger.log(`findUserByEmail: Sending Request to User Service to retrieve Data of User with email ${email}`);
            const user = await firstValueFrom(this.clientProxy.send<UserData>({ cmd: UserServiceTCPEndpoints.FIND_USER_EMAIL }, email));
            this.logger.log(`findUserByEmail: Sucessfully retrieved details of User with email ${email}`);
            return user;
        } catch (err) {
            this.logger.error(`findUserByEmail: Got error while trying to retrieve Data of User with email ${email}: ${err.message}`, err.stack);
            throw err;
        }
    }

    async findUserByUsername(username: string): Promise<UserData> {
        try {
            this.logger.log(`findUserByUsername: Sending Request to User Service to retrieve Data of User with username ${username}`);
            const user = await firstValueFrom(this.clientProxy.send<UserData>({ cmd: UserServiceTCPEndpoints.FIND_USER_USERNAME }, username));
            this.logger.log(`findUserByUsername: Sucessfully retrieved details of User with uid ${username}`);
            return user;
        } catch (err) {
            this.logger.error(`findUserByUsername: Got error while trying to retrieve Data of User with uid ${username}: ${err.message}`, err.stack);
            throw err;
        }
    }

    async getUserStatus(id: string): Promise<UserStatusData> {
        try {
            this.logger.log(`getUserStatus: Sending Request to User Service to retrieve Status Data with id ${id}`);
            const statusData = await firstValueFrom(this.clientProxy.send<UserStatusData>({ cmd: UserServiceTCPEndpoints.GET_USER_STATUS }, id));
            this.logger.log(`getUserStatus: Successfully retrieved details of Status Data with id ${id}`);
            return statusData;
        } catch (err) {
            this.logger.error(`getUserStatus: Got error while trying to retrieve Status with id ${id}: ${err.message}`, err.stack);
            throw err;
        }
    }

    async verifyUserEmail(userId: string): Promise<UserData> {
        try {
            this.logger.log(`verifyUserEmail: Sending Request to User Service to update User with uid ${userId} to be verified`);
            const userData = await firstValueFrom(this.clientProxy.send<UserData>({ cmd: UserServiceTCPEndpoints.VERIFY_USER_EMAIL }, userId));
            this.logger.log(`verifyUserEmail: Successfully verified User's Email with id ${userId}`);
            return userData;
        } catch (err) {
            this.logger.error(`verifyUserEmail: Got error while trying to verify User ${userId} email: ${err.message}`, err.stack);
            throw err;
        }
    }

    async checkEmailExists(email: string): Promise<boolean> {
        try {
            this.logger.log(`checkEmailExists: Sending Request to User Service to check if email ${email} exists`);
            const res = await firstValueFrom(this.clientProxy.send<boolean>({ cmd: UserServiceTCPEndpoints.CHECK_EMAIL_EXISTS }, email));
            this.logger.log(`checkEmailExists: Successfully executed query against User Service with result: ${res} for email ${email}`);
            return res;
        } catch (err) {
            this.logger.error(`checkEmailExists: Got error while trying to check if email ${email} exists: ${err.message}`, err.stack);
            throw err;
        }
    }

    async checkUserExists(user: { userId: string, idType: UserIdTypes}): Promise<boolean> {
        try {
            this.logger.log(`checkUserExists: Sending Request to User Service to check if id ${user.userId} exists`);
            const res = await firstValueFrom(this.clientProxy.send<boolean>({ cmd: UserServiceTCPEndpoints.CHECK_USER_EXISTS }, user));
            this.logger.log(`checkUserExists: Successfully executed query against User Service with result: ${res} for id ${user.userId}`);
            return res;
        } catch (err) {
            this.logger.error(`checkUserExists: Got error while trying to check if user ${user.userId} exists: ${err.message}`, err.stack);
            throw err;
        }
    }

    async updatePassword(userData: EmailLogin): Promise<UserData> {
        try {
            this.logger.log(`updatePassword: Sending Request to User Service to update password for ${userData.email}`);
            const updatedData = await firstValueFrom(this.clientProxy.send<UserData>({ cmd: UserServiceTCPEndpoints.RESET_PASSWORD }, userData));
            this.logger.log(`updatePassword: Successfully updated Password for user ${userData.email}`);
            return updatedData;
        } catch (err) {
            this.logger.error(`updatePassword: Got error while trying to update password for ${userData.email}: ${err.message}`, err.stack);
            throw err;
        }
    }

    async updateUserData(userData: UserData): Promise<UserData> {
        try {
            this.logger.log(`updateUserData: Sending Request to User Service to update User Data for ${userData.uid}`);
            const updatedData = await firstValueFrom(this.clientProxy.send<UserData>({ cmd: UserServiceTCPEndpoints.UPDATE_USER_DATA }, userData));
            this.logger.log(`updateUserData: Successfully updated User Data for uid ${userData.uid}`);
            return updatedData;
        } catch (err) {
            this.logger.error(`updateUserData: Got error while trying to update User Data for uid ${userData.uid}: ${err.message}`, err.stack);
            throw err;
        }
    }
}
