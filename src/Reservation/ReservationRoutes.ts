import { Router } from "express";
import { sanitizeReservationInput, validateReservationSchema } from "./ReservationValidations.js";
import { create, findAll, findOne, remove, update } from "./ReservationController.js";

const reservationRouter = Router();

reservationRouter.get("/", findAll)
reservationRouter.get("/:id", findOne)
reservationRouter.post("/",sanitizeReservationInput, validateReservationSchema, create)
reservationRouter.put("/:id", sanitizeReservationInput, update)
reservationRouter.patch("/:id", sanitizeReservationInput, update)
reservationRouter.delete("/:id", remove)

export default reservationRouter;