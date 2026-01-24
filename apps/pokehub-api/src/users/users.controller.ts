import { UpdateUserProfileDTO } from './dto/update-user-profile.dto';
import { IUsersService, USERS_SERVICE } from './users.service.interface';
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Head,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  TokenAuth,
  TokenAuthGuard,
  User,
} from '@pokehub/backend/shared-auth-utils';
import { AppLogger } from '@pokehub/backend/shared-logger';
import type { UserJwtData } from '@pokehub/shared/shared-user-models';

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
    @User() user: UserJwtData,
    @Body() data: UpdateUserProfileDTO
  ) {
    this.logger.log(
      `Got request to update user profile for user ${userId}: ${JSON.stringify(
        data
      )}`
    );

    // Users can only update their own account
    if (user.id !== userId) {
      throw new ForbiddenException('You can only update your own account');
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

  @Delete(':userId')
  @UseGuards(TokenAuthGuard)
  @TokenAuth('ACCESS_TOKEN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('userId') userId: string, @User() user: UserJwtData) {
    this.logger.log(`Got request to delete user ${userId}`);

    // Users can only delete their own account
    if (user.id !== userId) {
      throw new ForbiddenException('You can only delete your own account');
    }

    await this.usersService.deleteUser(userId);
  }
}
