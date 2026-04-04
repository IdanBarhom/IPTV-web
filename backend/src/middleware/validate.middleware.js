/**
 * Generic Zod validation middleware factory.
 * Validates req.body, req.params, and req.query against a Zod schema.
 * On success, replaces req fields with the coerced/transformed Zod output.
 * On failure, responds 400 with structured field errors.
 *
 * @param {import('zod').ZodSchema} schema - A Zod object schema with optional
 *   `body`, `params`, and/or `query` keys.
 * @returns {import('express').RequestHandler}
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: result.error.flatten().fieldErrors,
    });
  }

  // body is a plain writable property — replace it entirely with the cleaned output
  if (result.data.body) req.body = result.data.body;

  // Express v5 defines req.params and req.query as getter-only properties (strict mode
  // would throw on direct assignment), so we mutate them in-place instead.
  if (result.data.params) Object.assign(req.params, result.data.params);
  if (result.data.query)  Object.assign(req.query,  result.data.query);

  next();
};

export default validate;
