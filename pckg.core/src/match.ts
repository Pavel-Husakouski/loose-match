import { __toFunction } from './combinators.js';
import { Infer, SchemaRule, ValidationResult } from './types.js';

/**
 * An assertion function
 */
export function match(actual: unknown) {
  return {
    with(schema: SchemaRule<any>, fn?: (arg: any) => any) {
      const rule = __toFunction(schema);
      const [succeed, message] = rule(actual);

      if (succeed) {
        return;
      }

      const exception = fn ? fn({ message, actual, schema }) : null;

      throw exception || new AssertionError(message, actual, message);
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
