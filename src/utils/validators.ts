// onboarding form validators

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

const ok: ValidationResult = { ok: true };
const fail = (error: string): ValidationResult => ({ ok: false, error });

export const validateName = (name: string): ValidationResult => {
  const trimmed = name.trim();
  if (trimmed.length < 1) return fail('Name is required');
  if (trimmed.length < 2) return fail('Name must be at least 2 characters');
  if (trimmed.length > 40) return fail('Name must be under 40 characters');
  if (!/^[\p{L}\p{M}'\- ]+$/u.test(trimmed)) return fail('Name has invalid characters');
  return ok;
};

export const validateAge = (age: number): ValidationResult => {
  if (!Number.isFinite(age)) return fail('Enter a valid age');
  if (!Number.isInteger(age)) return fail('Age must be a whole number');
  if (age < 5) return fail('Age must be at least 5');
  if (age > 120) return fail('Age must be under 120');
  return ok;
};

// weight in kg
export const validateWeight = (weightKg: number): ValidationResult => {
  if (!Number.isFinite(weightKg)) return fail('Enter a valid weight');
  if (weightKg < 20) return fail('Weight must be at least 20kg');
  if (weightKg > 300) return fail('Weight must be under 300kg');
  return ok;
};

// height in cm
export const validateHeight = (heightCm: number): ValidationResult => {
  if (!Number.isFinite(heightCm)) return fail('Enter a valid height');
  if (heightCm < 80) return fail('Height must be at least 80cm');
  if (heightCm > 250) return fail('Height must be under 250cm');
  return ok;
};

export const validateGoalMl = (goalMl: number): ValidationResult => {
  if (!Number.isFinite(goalMl)) return fail('Enter a valid goal');
  if (goalMl < 500) return fail('Goal must be at least 500ml');
  if (goalMl > 8000) return fail('Goal must be under 8L');
  return ok;
};

export const validateAmountMl = (ml: number): ValidationResult => {
  if (!Number.isFinite(ml)) return fail('Enter a valid amount');
  if (ml <= 0) return fail('Amount must be positive');
  if (ml > 3000) return fail('Amount too large for one entry');
  return ok;
};

// boolean predicate variants used by onboarding steps
export const isValidName = (s: string): boolean => {
  const t = (s ?? '').trim();
  return t.length >= 1 && t.length <= 50;
};

export const isValidAge = (n: number): boolean =>
  Number.isFinite(n) && n >= 1 && n <= 120;

export const isValidWeightKg = (n: number): boolean =>
  Number.isFinite(n) && n >= 20 && n <= 300;

export const isValidHeightCm = (n: number): boolean =>
  Number.isFinite(n) && n >= 50 && n <= 260;
