import { Module } from '@nestjs/common';
import { AwsSdkModule } from 'nest-aws-sdk';
import { S3 } from 'aws-sdk';
import { S3Service } from './s3.service';
import { LoggerModule } from '@pokehub/common/logger';
import { S3_SERVICE } from './s3-service.interface';

@Module({
    imports: [AwsSdkModule.forFeatures([S3]), LoggerModule],
    providers: [{ useClass: S3Service, provide: S3_SERVICE }],
    exports: [{ useClass: S3Service, provide: S3_SERVICE }],
 })
export class AWSModule {}