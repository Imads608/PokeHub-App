import { Injectable } from "@nestjs/common";
import { AppLogger } from "@pokehub/common/logger";
import * as faker from 'faker';

@Injectable()
export class UsernameGeneratorService {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(UsernameGeneratorService.name);
  }

  generateWithName(firstName: string, lastName: string): string {
      let name: string = faker.name.findName(firstName, lastName);
      name = name.toLowerCase();
      this.logger.log(`generateWithName: After Lower case: ${name}`);
      name = name.replace(' ', '');
      this.logger.log(`generateWithName: After replace: ${name}`);
      const rand = Math.floor(Math.random() * 100) + 1;
      this.logger.log(`generateWithName: ${rand}, ${name}${rand}`);
      return `${name}${rand}`;
  }

  generateWithoutName(): string {
      let name: string = faker.name.findName();
      name = name.toLowerCase();
      name = name.replace(' ', '');
      const rand = Math.floor(Math.random() * 100) + 1;
      return `${name}${rand}`;
  }
}