import { BadRequestException, Body, Controller, Inject, InternalServerErrorException, Param, Post, Put, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { IUserService, USER_SERVICE } from '@pokehub/user/database';
import { AppLogger } from '@pokehub/common/logger';
import { UserData } from '@pokehub/user/models';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { ConfigService } from '@nestjs/config';
import { Multer } from 'multer';
import { IUtilsService, UTILS_SERVICE } from '../common/utils-interface.service';

@Controller('')
export class HttpUserController {
  constructor(
    @Inject(USER_SERVICE) private readonly userService: IUserService,
    @Inject(UTILS_SERVICE) private readonly utilsService: IUtilsService, private readonly configService: ConfigService,
    private readonly logger: AppLogger
  ) {
    this.logger.setContext(HttpUserController.name);
  }

  @UseInterceptors(FileFieldsInterceptor([
    { name: 'avatar', maxCount: 1 },
  ]))
  @Put(':userId/profile')
  async updateUserProfile(@Param('userId') userId: string, @Body('user') userJsonStr: string, @UploadedFiles() data: { avatar?: Express.Multer.File[] }): Promise<UserData> {
    if (!userId || !data || !userJsonStr)
      throw new BadRequestException();

    try {
      this.logger.log(`updateUserProfile: Got request to update User Profile with uid: ${userId}`);
      const profileUpdates: UserData = JSON.parse(userJsonStr);

      // Save Avatar Image to Object Store
      if (data.avatar && data.avatar.length === 1) {
        profileUpdates.avatar = await this.utilsService.saveNewAvatar(userId, data.avatar?.[0].buffer);
      }

      // Update Database
      const updatedUser = await this.userService.updateUserData(profileUpdates);

      // Populate URL and send back User Data
      this.utilsService.populateAvatarURL(updatedUser);
      return updatedUser;
    } catch (err) {
      this.logger.error(`updateUserProfile: Got error while updating User Profile:: ${JSON.stringify(err)}`);
      throw new InternalServerErrorException();
    }
  }


  @UseInterceptors(FileInterceptor('avatar'))
  @Post(':userId/avatar')
  async updateUserAvatar(@UploadedFile() avatar: Express.Multer.File, @Param('userId') userId: string): Promise<UserData> {
    if (!userId || !avatar)
      throw new BadRequestException();
    try {
      // Save Avatar Image to Object Store
      this.logger.log(`updateUserAvatar: Got request to upload and save User avatar for ${userId}`);
      const bucketInfo = await this.utilsService.saveNewAvatar(userId, avatar.buffer);

      const user = await this.userService.updateAvatar(userId, bucketInfo);
      
      // Populate URL and send back User Data
      this.utilsService.populateAvatarURL(user);
      return user;
    } catch (err) {
      this.logger.error(`updateUserAvatar: Got error while updating User's avatar to Object Store and Database: ${JSON.stringify(err)}`);
      throw new InternalServerErrorException();
    }
  }
}
