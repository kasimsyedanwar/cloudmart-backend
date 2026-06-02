import { RequestHandler } from 'express';
import { z } from 'zod';

type RequestValidationSchema = {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
};

export const validateRequest = (
  schema: RequestValidationSchema,
): RequestHandler => {
  return (req, _res, next): void => {
    if (schema.body) {
      req.body = schema.body.parse(req.body);
    }

    if (schema.params) {
      const parsedParams = schema.params.parse(req.params);
      req.params = parsedParams as typeof req.params;
    }

    if (schema.query) {
      const parsedQuery = schema.query.parse(req.query);
      req.query = parsedQuery as typeof req.query;
    }

    next();
  };
};
