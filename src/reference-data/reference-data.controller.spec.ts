import { Test, TestingModule } from '@nestjs/testing';
import { ReferenceDataController } from './reference-data.controller';
import { ReferenceDataService } from './reference-data.service';

describe('ReferenceDataController', () => {
let controller: ReferenceDataController;

beforeEach(async () => {
const module: TestingModule = await Test.createTestingModule({
controllers: [ReferenceDataController],
providers: [
{ provide: ReferenceDataService, useValue: {} }
],
}).compile();

controller = module.get<ReferenceDataController>(ReferenceDataController);
});

it('should be defined', () => {
expect(controller).toBeDefined();
});
});