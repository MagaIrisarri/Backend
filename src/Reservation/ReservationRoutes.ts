import { Router } from "express";
import { sanitizeReservationInput } from "./ReservationValidations.js";
import { create, findAll, findOne, remove, update } from "./ReservationController.js";

export const bookRouter = Router();

bookRouter.get("/", findAll)
bookRouter.get("/:id", findOne)
bookRouter.post("/",sanitizeReservationInput, create)
bookRouter.put("/:id", sanitizeReservationInput, update)
bookRouter.patch("/:id", sanitizeReservationInput, update)
bookRouter.delete("/:id", remove)
