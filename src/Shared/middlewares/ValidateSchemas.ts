import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';

export const validateSchema = (schema: ZodObject<any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validamos que el body, query o params cumplan con las reglas del esquema
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // Si todo está perfecto, dejamos que la petición continúe hacia el Controlador
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Si hay un error de validación, respondemos con un 400 y el detalle limpio
        res.status(400).json({
          message: 'Error de validación en los datos enviados',
          errors: error.issues.map(err => ({
            campo: err.path.join('.'),
            mensaje: err.message,
          })),
        });
        return; // Retornamos para detener la ejecución
      }
      
      // Si ocurre un error inesperado
      res.status(500).json({ message: 'Error interno del servidor en la validación' });
      return;
    }
  };
};