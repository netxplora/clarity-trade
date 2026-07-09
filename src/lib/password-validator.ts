/**
 * Password Strength Validator
 * Enforces strong password requirements for registration.
 */

export interface PasswordValidation {
  isValid: boolean;
  score: number; // 0-5
  errors: string[];
}

const RULES = [
  { test: (p: string) => p.length >= 8, message: "At least 8 characters" },
  { test: (p: string) => /[A-Z]/.test(p), message: "One uppercase letter" },
  { test: (p: string) => /[a-z]/.test(p), message: "One lowercase letter" },
  { test: (p: string) => /[0-9]/.test(p), message: "One number" },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), message: "One special character (!@#$%^&*)" },
];

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];
  let score = 0;

  for (const rule of RULES) {
    if (rule.test(password)) {
      score++;
    } else {
      errors.push(rule.message);
    }
  }

  return {
    isValid: score >= 4, // Allow 1 missing rule (e.g. special char optional for score>=4)
    score,
    errors,
  };
}

export function getStrengthLabel(score: number): { label: string; color: string } {
  if (score <= 1) return { label: "Very Weak", color: "bg-red-500" };
  if (score === 2) return { label: "Weak", color: "bg-orange-500" };
  if (score === 3) return { label: "Fair", color: "bg-amber-500" };
  if (score === 4) return { label: "Strong", color: "bg-green-500" };
  return { label: "Very Strong", color: "bg-green-600" };
}
