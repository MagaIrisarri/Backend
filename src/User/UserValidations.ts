import { NextFunction, Request, Response } from "express"
import { ZodType } from "zod"

export const sanitizeUserInput = (req: Request, res: Response, next: NextFunction) => {
    req.body.sanitizedUserInput = {
        dni: req.body.dni,
        name: req.body.name,
        last_name: req.body.last_name,
        date_of_brthdate: req.body.date_of_brthdate,
        email: req.body.email,
        phone: req.body.phone,
        password: req.body.password,
        file: req.body.file,
        type: req.body.type,
        ownerId: req.params.ownerId,
    }

    Object.keys(req.body.sanitizedUserInput).forEach((key) => {
        if (req.body.sanitizedUserInput[key] === undefined) {
            delete req.body.sanitizedUserInput[key]
        }
    })

    next()
}

export const validateUserSchema = (schema: ZodType) => async (req: Request, res: Response, next: NextFunction) => {
    const result = await schema.safeParseAsync(req.body.sanitizedUserInput);

    if (!result.success) {
        return res.status(400).json({ message: "Validation error", error: result.error });
    }

    req.body.sanitizedUserInput = result.data;
    next();
}
