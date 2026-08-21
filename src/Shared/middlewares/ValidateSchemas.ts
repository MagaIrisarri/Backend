import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validateSchema = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
       schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: 'Error de validación en los datos enviados',
          errors: error.issues.map(err => ({
            campo: err.path.join('.'),
            mensaje: err.message,
          })),
        });
        return;
      }
      res.status(500).json({ message: 'Error interno del servidor en la validación' });
       return;
    }

  };
};