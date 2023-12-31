import { Test, TestingModule } from '@nestjs/testing';
import { TcpUserController } from './tcp.controller';

describe('UserController', () => {
  let controller: TcpUserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TcpUserController],
    }).compile();

    controller = module.get<TcpUserController>(TcpUserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
