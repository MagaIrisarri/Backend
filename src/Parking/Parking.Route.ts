import {Router} from "express";
import{
  add,
  findAll,
  findOneById,
  update,
  remove,
} from "./Parking.Controller.js";

const ParkingRouter = Router();

ParkingRouter.post('/', add);

ParkingRouter.get('/', findAll);
ParkingRouter.get('/:id', findOneById);

ParkingRouter.put('/:id', update);

ParkingRouter.delete('/:id', remove);

export default ParkingRouter;