export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationIssue[];
}

export function createValidationResult(errors: readonly ValidationIssue[]): ValidationResult {
  return {
    valid: errors.length === 0,
    errors
  };
}
