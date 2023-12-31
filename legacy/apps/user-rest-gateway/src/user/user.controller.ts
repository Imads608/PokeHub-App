import { BadRequestException, Body, Controller, Param, Post, Put, UploadedFile, UploadedFiles, UseInterceptors, } from '@nestjs/common';
import { UserData } from '@pokehub/user/models';
import { AppLogger } from '@pokehub/common/logger';
import { Express } from 'express';
import { Multer } from 'multer';
import { AnyFilesInterceptor, FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { createReadStream, unlinkSync } from 'fs';
import * as FormData  from 'form-data';
import path = require('path');
import { UserServiceRESTEndpoints } from '@pokehub/user/endpoints';
import { ResourceInterceptor } from '../common/resource.interceptor';
import { Readable } from 'stream';

@Controller('')
export class UserController {
  constructor(private readonly httpService: HttpService, private readonly configService: ConfigService, private readonly logger: AppLogger) {
    logger.setContext(UserController.name);
  }

  @UseInterceptors(ResourceInterceptor)
  @UseInterceptors(FileInterceptor('avatar', { 
    dest: './upload',
    fileFilter: (req, file, callback) => {
      const ext = path.extname(file.originalname);
        if(ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
            return callback(new Error('Only images are allowed'), false);
        }
        callback(null, true)
    } 
  }))
  @Post(':userId/avatar')
  async updateUserAvatar(@UploadedFile() avatar: Express.Multer.File, @Param('userId') userId: string): Promise<UserData> {
    // Creating Payload
    this.logger.log(`updateUserAvatar: Sending file: ${avatar.path}`);
    const formData = new FormData();
    formData.append('avatar', createReadStream(avatar.path), { filename: avatar.filename });

    // Send Data
    const data = await firstValueFrom(this.httpService.post<UserData>(`${this.configService.get<string>('protocol')}://${this.configService.get<string>('userService.host')}:${this.configService.get<string>('userService.port')}${UserServiceRESTEndpoints.getUserAvatarEndpoint(userId)}`,
                            formData, { headers: { ...formData.getHeaders() }}));
    
    this.logger.log(`updateUserAvatar: Successfully uploaded new avatar for user ${userId}. Deleting temporary file`);
    // Delete Temporary Image File
    unlinkSync(avatar.path);

    this.logger.log(`updateUserAvatar: Sending data ${JSON.stringify(data.data)}`);
    return data.data;
  }

  @UseInterceptors(ResourceInterceptor)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'avatar', maxCount: 1 },
  ]))
  @Put(':userId/profile')
  async updateUserProfile(@Param('userId') userId: string, @Body('user') userJsonStr: string, @UploadedFiles() data: { avatar?: Express.Multer.File[] }): Promise<UserData> {
    this.logger.log(`updateUser: Got request to update profile: ${JSON.stringify(data)}`);
    
    // Handle Failure Scenarios
    if (!data || !userJsonStr || !userId)
      throw new BadRequestException();

    // Create and Forward Form Data containing profile updates
    const fwdFormData = new FormData();
    fwdFormData.append('user', userJsonStr);
    
    if (data.avatar && data.avatar.length > 0) {
      const ext = path.extname(data.avatar[0].originalname);
      if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' || (!data.avatar[0].originalname && !data.avatar[0].filename)) {
        throw new BadRequestException({ statusCode: 400, message: "Not a valid profile image"});
      }
      
      const avatarStream = Readable.from(data.avatar[0].buffer) || data.avatar[0].stream;
      this.logger.log(`updateUserProfile: Adding image to form data: ${avatarStream}`);
      fwdFormData.append('avatar', avatarStream, { filename: data.avatar?.[0].originalname || data.avatar?.[0].filename });
      
    }
    
    // Send Data
    this.logger.log("updateUserProfile: Sending updates to User Service");
    const updatesRes = await firstValueFrom(this.httpService.put<UserData>(`${this.configService.get<string>('protocol')}://${this.configService.get<string>('userService.host')}:${this.configService.get<string>('userService.port')}/${userId}/profile`,
                            fwdFormData, { headers: { ...fwdFormData.getHeaders() }}));
    return updatesRes.data;//return await this.userService.updateUserData(userData);
  }
}
