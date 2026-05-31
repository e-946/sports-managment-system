import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validateBody = (schema: ZodSchema) => {
  return async (req: any, res: any, next: any) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Return a clean error message, or join them
        const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        return res.status(400).json({
          error: `Erro de validação: ${message}`,
          details: error.errors
        });
      }
      return res.status(400).json({ error: 'Erro de validação de dados.' });
    }
  };
};
