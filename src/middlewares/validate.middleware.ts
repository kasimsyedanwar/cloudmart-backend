import { ZodType, z } from 'zod';
import { NextFunction, Request, Response } from 'express';

export const validateRequest = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body ?? {},
      params: req.params ?? {},
      query: req.query ?? {},
    });

    if (!result.success) {
      return res.status(400).json({ errors: z.treeifyError(result.error) });
    }

    next();
  };
};
