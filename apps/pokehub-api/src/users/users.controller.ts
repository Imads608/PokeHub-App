import { UpdateUserProfileDTO } from './dto/update-user-profile.dto';
import { IUsersService, USERS_SERVICE } from './users.service.interface';
import {
  Body,
  Controller,
  Head,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TokenAuth, TokenAuthGuard } from '@pokehub/backend/shared-auth-utils';
import { AppLogger } from '@pokehub/backend/shared-logger';

@Controller()
export class UsersController {
  constructor(
    private readonly logger: AppLogger,
    @Inject(USERS_SERVICE) private readonly usersService: IUsersService
  ) {
    logger.setContext(UsersController.name);
  }

  // @Get(':userId')
  // @UseGuards(TokenAuthGuard)
  // @TokenAuth('ACCESS_TOKEN')
  // async getUser(
  //   @Param('userId') userId: string,
  // ) {
  //   this.logger.log(`Got request to update user profile for user ${userId}`);
  //   return this.usersService.updateUserProfile(userId, data);
  // }

  @Post(':userId/profile')
  @UseGuards(TokenAuthGuard)
  @TokenAuth('ACCESS_TOKEN')
  async updateUserProfile(
    @Param('userId') userId: string,
    @Body() data: UpdateUserProfileDTO
  ) {
    this.logger.log(
      `Got request to update user profile for user ${userId}: ${JSON.stringify(
        data
      )}`
    );
    if (!data.username && !data.avatar) {
      return;
    }
    return this.usersService.updateUserProfile(userId, data);
  }

  @Head(':id')
  @UseGuards(TokenAuthGuard)
  @TokenAuth('ACCESS_TOKEN')
  async getUserCore(
    @Param('id') id: string,
    @Query('dataType') dataType: 'username' | 'email' | 'id'
  ) {
    this.logger.log(
      `Got request to check user existence with dataType: ${dataType}`
    );
    const userRes = await this.usersService.getUserCore(id, dataType);
    if (!userRes) {
      throw new NotFoundException('User not found');
    }
    return userRes;
  }
}
