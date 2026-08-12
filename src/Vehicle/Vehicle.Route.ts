import { Router } from "express";
import {
  add,
  findAll,
  findOneById,
  update,
  remove,
} from "./Vehicle.Controller.js";

const VehicleRouter = Router();

VehicleRouter.post('/', add);

VehicleRouter.get('/', findAll);
VehicleRouter.get('/:id', findOneById);

VehicleRouter.put('/:id', update);

VehicleRouter.delete('/:id', remove);

export default VehicleRouter;