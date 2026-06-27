/**
 * Shared validation middleware using Zod schemas.
 *
 * Wraps Zod schema parsing so route handlers can use a consistent pattern:
 *
 *   router.post("/", validate(createSchema), async (req, res) => { ... });
 *
 * On success, sets req.validatedBody to the parsed (and defaulted) data.
 * On failure, responds 400 with the Zod issues array.
 */

import { ZodError } from "zod";

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.issues,
      });
    }
    req.validatedBody = result.data;
    next();
  };
}
