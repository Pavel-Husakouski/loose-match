import { __toFunction } from './combinators.js';
import { Infer, SchemaRule, ValidationResult } from './types.js';

/**
 * An assertion function
 */
export function match(value: unknown) {
  return {
    with(schema: SchemaRule<any>) {
      const rule = __toFunction(schema);
      const [succeed, message] = rule(value);

      if (succeed) {
        return;
      }

      throw new AssertionError(message, value, message);
    },
  };
}

/**
 * An assertion error
 */
export class AssertionError extends Error {
  constructor(
    message: string,
    public actual: any,
    public expected: any
  ) {
    super(message);
    this.name = 'AssertionError';
  }
}

/**
 * Validate a value against a schema
 * @param schema The schema to validate against
 * @param value The value to validate
 * @returns The validation result
 */
export function validate<T extends SchemaRule<any>>(schema: T, value: unknown): ValidationResult<Infer<T>> {
  const rule = __toFunction(schema);

  return rule(value as any);
}
