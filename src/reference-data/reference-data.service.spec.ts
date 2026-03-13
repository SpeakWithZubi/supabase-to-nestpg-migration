import { Test, TestingModule } from '@nestjs/testing';
import { ReferenceDataService } from './reference-data.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReferenceDataService', () => {
let service: ReferenceDataService;

beforeEach(async () => {
const module: TestingModule = await Test.createTestingModule({
providers: [
ReferenceDataService,
{ provide: PrismaService, useValue: {} }
],
}).compile();

service = module.get<ReferenceDataService>(ReferenceDataService);
});

it('should be defined', () => {
expect(service).toBeDefined();
});
});