import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Use the Api\'s accordingly to get the best out of everything';
  }
}
