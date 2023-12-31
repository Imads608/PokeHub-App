import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AwsSdkModule } from 'nest-aws-sdk';
import { SharedIniFileCredentials, S3 } from 'aws-sdk';
import { ServiceConfigurationOptions } from 'aws-sdk/lib/service';
import { AWSModule } from './aws/aws.module';
import { LoggerModule } from '@pokehub/common/logger';

@Module({
  controllers: [],
  providers: [],
  exports: [AWSModule],
  imports: [
    AWSModule,
    LoggerModule,
    AwsSdkModule.forRootAsync({
      defaultServiceOptions: {
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          return {
            region: 'us-east-1',
            
          }
        },
      }
    })
  ],
})
export class ObjectStoreModule {}
