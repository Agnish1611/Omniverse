import { ValidationResult } from '@/types/common';

export function validateRequired(value: string, fieldName: string): ValidationResult {
  const isValid = value.trim().length > 0;
  return {
    isValid,
    errors: isValid ? [] : [`${fieldName} is required`]
  };
}

export function validateMinLength(value: string, minLength: number, fieldName: string): ValidationResult {
  const isValid = value.length >= minLength;
  return {
    isValid,
    errors: isValid ? [] : [`${fieldName} must be at least ${minLength} characters`]
  };
}

export function validateMaxLength(value: string, maxLength: number, fieldName: string): ValidationResult {
  const isValid = value.length <= maxLength;
  return {
    isValid,
    errors: isValid ? [] : [`${fieldName} must be no more than ${maxLength} characters`]
  };
}

export function validateUsername(username: string): ValidationResult {
  const results = [
    validateRequired(username, 'Username'),
    validateMinLength(username, 2, 'Username'),
    validateMaxLength(username, 20, 'Username')
  ];

  const allErrors = results.flatMap(result => result.errors);
  const isValid = allErrors.length === 0;

  // Additional username-specific validation
  if (isValid && !/^[a-zA-Z0-9_-]+$/.test(username)) {
    allErrors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}

export function validateMessage(message: string): ValidationResult {
  const results = [
    validateRequired(message, 'Message'),
    validateMaxLength(message, 500, 'Message')
  ];

  const allErrors = results.flatMap(result => result.errors);

  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}
