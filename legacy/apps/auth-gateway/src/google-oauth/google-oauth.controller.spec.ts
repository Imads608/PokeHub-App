import { Test, TestingModule } from '@nestjs/testing';
import { GoogleOauthController } from './google-oauth.controller';

describe('GoogleOauthController', () => {
  let controller: GoogleOauthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoogleOauthController],
    }).compile();

    controller = module.get<GoogleOauthController>(GoogleOauthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
