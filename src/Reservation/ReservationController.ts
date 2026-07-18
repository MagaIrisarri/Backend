import { Request, Response } from "express";
import { ReservationRepository } from "./ReservationRepository.js";
import { ReservationService } from "./ReservationService.js";

const service = new ReservationService(new ReservationRepository());

export const findAll = (req: Request, res: Response) => {
    res.json(service.findAll());
}

export const findOne = (req: Request, res: Response) => {
    const id = req.params.id as string;
    const reservation = service.findOne(id);

    if (!reservation)
        return res.status(404).send({ message: "Reserva not found" });

    return res.json(reservation);
}

export const create = (req: Request, res: Response) => {
    const reservation = service.create(req.body.sanitizedReservationInput);

    return res.status(201).json({ message: "reservation added", data: reservation });
}

export const update = (req: Request, res: Response) => {
    const id = req.params.id as string;
    const reservation = service.update(id, req.body.sanitizedReservationInput);

    if (!reservation)
        return res.status(404).send({ message: "reservation not found" });

    res.json({ message: "reservation updated successfully", data: reservation });
}

export const remove = (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = service.remove(id);

    if (!result)
        return res.status(500).json({ message: "There was an internal error deleting the reservation" })

    return res.json({ message: `reservation with id: ${result.id} successfully deleted` })
}
