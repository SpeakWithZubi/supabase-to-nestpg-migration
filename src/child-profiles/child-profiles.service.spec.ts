import { Test, TestingModule } from '@nestjs/testing';
import { ChildProfilesService } from './child-profiles.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ChildProfilesService', () => {
let service: ChildProfilesService;

beforeEach(async () => {
const module: TestingModule = await Test.createTestingModule({
providers: [
ChildProfilesService,
{ provide: PrismaService, useValue: {} }
],
}).compile();

service = module.get<ChildProfilesService>(ChildProfilesService);
});

it('should be defined', () => {
expect(service).toBeDefined();
});
});