import { AppModule } from '../../../pokehub-api/src/app/app.module';
import type { INestApplication } from '@nestjs/common';
import { Controller, Get, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ServiceError } from '@pokehub/backend/shared-exceptions';
import request from 'supertest';

// 1. Create a dummy controller that throws errors on demand
@Controller('test-exceptions')
class TestExceptionsController {
  @Get('http')
  throwHttpException() {
    throw new NotFoundException('Item not found from test');
  }

  @Get('service')
  throwServiceError() {
    throw new ServiceError('ServiceError', 'A service error occurred');
  }

  @Get('unknown')
  throwUnknownError() {
    throw new Error('An unknown error occurred');
  }

  @Get('bad-request')
  throwBadRequest() {
    throw new ServiceError('BadRequest', 'Invalid input provided');
  }

  @Get('unauthorized')
  throwUnauthorized() {
    throw new ServiceError('Unauthorized', 'You shall not pass');
  }
}

describe('CatchEverythingFilter (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // 2. Create the test application, but this time KEEP the global filter
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [TestExceptionsController], // 3. Add our dummy controller to the app
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should catch an HttpException and return the correct status and body', async () => {
    await request(app.getHttpServer())
      .get('/test-exceptions/http')
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toEqual('Item not found from test');
        expect(res.body.statusCode).toEqual(404);
      });
  });

  it('should catch an unknown error and return a 500 status', async () => {
    await request(app.getHttpServer())
      .get('/test-exceptions/unknown')
      .expect(500)
      .expect((res) => {
        expect(res.body.message).toEqual('An Error Occurred');
      });
  });

  it('should catch a generic ServiceError and return a 500 status', async () => {
    await request(app.getHttpServer())
      .get('/test-exceptions/service')
      .expect(500)
      .expect((res) => {
        expect(res.body.message).toEqual('A service error occurred');
      });
  });

  it('should catch a BadRequest ServiceError and return a 400 status', async () => {
    await request(app.getHttpServer())
      .get('/test-exceptions/bad-request')
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toEqual('Invalid input provided');
      });
  });

  it('should catch an Unauthorized ServiceError and return a 401 status', async () => {
    await request(app.getHttpServer())
      .get('/test-exceptions/unauthorized')
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toEqual('You shall not pass');
      });
  });
});
