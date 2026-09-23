import { Test, TestingModule } from '@nestjs/testing';
import { SuscripcionController } from './suscripcion.controller';

describe('SuscripcionController', () => {
  let controller: SuscripcionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuscripcionController],
    }).compile();

    controller = module.get<SuscripcionController>(SuscripcionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
