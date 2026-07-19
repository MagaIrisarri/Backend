import { NextFunction, Request, Response } from "express"

export const sanitizeReservationInput = (req: Request, res: Response, next: NextFunction) => {
    req.body.sanitizedReservationInput = {
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