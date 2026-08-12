import { NextFunction, Request, Response } from "express"
import { ReservationSchema } from "./ReservationSchema.js"

export const sanitizeReservationInput = (req: Request, res: Response, next: NextFunction) => {
    req.body.sanitizedReservationInput = {
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        locationID: req.body.locationID,
        status: req.body.status,
        vehicleID: req.body.vehicleID,
    }

    Object.keys(req.body.sanitizedReservationInput).forEach((key) => {
        if (req.body.sanitizedReservationInput[key] === undefined) {
            delete req.body.sanitizedReservationInput[key]
        }
    })

    next()
}

export const validateReservationSchema = async (req: Request, res: Response, next: NextFunction) => {
    const result = await ReservationSchema.safeParseAsync(req.body.sanitizedReservationInput);

    if (!result.success) {
        return res.status(400).json({ message: "Validation error", error: result.error });
    }

    req.body.sanitizedReservationInput = result.data;
    next();
}
