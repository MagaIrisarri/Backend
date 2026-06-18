import {Router} from 'express';
import{
  add,
  findAll,
  findOneById,
  update,
  remove,
} from './ParkingController.js';

export const parkingRouter = Router();

parkingRouter.post('/', add);

parkingRouter.get('/', findAll);
parkingRouter.get('/:id', findOneById);

parkingRouter.put('/:id', update);

parkingRouter.delete('/:id', remove);