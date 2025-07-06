import { IUsersService, USERS_SERVICE } from './users.service.interface';
import {
  Controller,
  Head,
  Inject,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { AppLogger } from '@pokehub/backend/shared-logger';

@Controller()
export class UsersController {
  constructor(
    private readonly logger: AppLogger,
    @Inject(USERS_SERVICE) private readonly usersService: IUsersService
  ) {
    logger.setContext(UsersController.name);
  }

  @Head(':id')
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
