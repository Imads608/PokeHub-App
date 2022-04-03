import { Controller, Param, Post, UploadedFile, UseInterceptors, } from '@nestjs/common';
import { UserData } from '@pokehub/user/models';
import { AppLogger } from '@pokehub/common/logger';
import { Express } from 'express';
import { Multer } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { createReadStream, unlinkSync } from 'fs';
import * as FormData  from 'form-data';
import path = require('path');
import { UserServiceRESTEndpoints } from '@pokehub/user/endpoints';

@Controller('')
export class UserController {
  constructor(private readonly httpService: HttpService, private readonly configService: ConfigService, private readonly logger: AppLogger) {
    logger.setContext(UserController.name);
  }

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
    const data = await firstValueFrom(this.httpService.post<UserData>(`${this.configService.get<string>('protocol')}://${this.configService.get<string>('userService.host')}:${this.configService.get<string>('userService.portHttp')}${UserServiceRESTEndpoints.getUserAvatarEndpoint(userId)}`,
                            formData, { headers: { ...formData.getHeaders() }}));
    
    this.logger.log(`updateUserAvatar: Successfully uploaded new avatar for user ${userId}. Deleting temporary file`);
    // Delete Temporary Image File
    unlinkSync(avatar.path);

    this.logger.log(`updateUserAvatar: Sending data ${JSON.stringify(data.data)}`);
    return data.data;
  }
}
