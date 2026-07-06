import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationChain } from "express-validator";
import { ValidationError } from "../utils/errors";
export function validate(chains: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(chains.map((c) => c.run(req)));
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const errors: Record<string, string[]> = {};
      result.array().forEach((e: any) => {
        const field = e.path || "general";
        if (!errors[field]) errors[field] = [];
        errors[field].push(e.msg);
      });
      return next(new ValidationError(errors));
    }
    next();
  };
}
