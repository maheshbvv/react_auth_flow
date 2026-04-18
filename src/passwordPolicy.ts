import type {
  PasswordBreachCheckResult,
  PasswordStrengthResult,
} from './types';

export function safePasswordBreachCheckResult(): PasswordBreachCheckResult {
  return { isPwned: false, exposureCount: 0 };
}

export function pwnedPasswordBreachCheckResult(
  exposureCount: number,
): PasswordBreachCheckResult {
  return {
    isPwned: true,
    exposureCount: Math.max(0, exposureCount),
  };
}

export function evaluatePasswordStrength(input: {
  password: string;
  minLength: number;
  email?: string;
  name?: string;
}): PasswordStrengthResult {
  const {
    password,
    minLength,
    email = '',
    name = '',
  } = input;
  const trimmedPassword = password.trim();

  if (!trimmedPassword) {
    return {
      level: 'weak',
      progress: 0,
      label: 'Weak',
      helperText:
        'Use a long password or passphrase you do not reuse elsewhere.',
    };
  }

  const loweredPassword = trimmedPassword.toLowerCase();
  const normalizedName = name.toLowerCase().trim();
  const normalizedEmail = email.toLowerCase().trim();
  const uniqueChars = new Set(trimmedPassword).size;
  const uniqueRatio = uniqueChars / trimmedPassword.length;
  const hasLower = /[a-z]/u.test(trimmedPassword);
  const hasUpper = /[A-Z]/u.test(trimmedPassword);
  const hasDigit = /\d/u.test(trimmedPassword);
  const hasSymbol = /[^A-Za-z0-9\s]/u.test(trimmedPassword);
  const hasSpaces = trimmedPassword.includes(' ');
  const wordCount = trimmedPassword
    .split(/\s+/u)
    .filter((part) => part.length >= 3).length;
  const characterGroupCount = [hasLower, hasUpper, hasDigit, hasSymbol].filter(
    Boolean,
  ).length;

  let score = 0;
  score += Math.min(trimmedPassword.length * 4, 56);
  score += Math.round(uniqueRatio * 18);
  score += characterGroupCount * 6;

  if (hasSpaces && wordCount >= 3) {
    score += 10;
  }

  let helperText = 'Looks usable, but longer and less predictable is better.';

  if (trimmedPassword.length < minLength) {
    return {
      level: 'weak',
      progress: 0.2,
      label: 'Weak',
      helperText: `Use at least ${minLength} characters.`,
    };
  }

  const commonPatterns = [
    'password',
    'passw0rd',
    'qwerty',
    'abc123',
    'letmein',
    'welcome',
    'admin',
    'football',
    'baseball',
    'dragon',
    'monkey',
    'iloveyou',
    '123456',
    '654321',
  ];

  if (commonPatterns.some((pattern) => loweredPassword.includes(pattern))) {
    score -= 24;
    helperText = 'Avoid common passwords or obvious word patterns.';
  }

  if (/^[a-z]+(?:19|20)\d{2}$/u.test(loweredPassword)) {
    score -= 12;
    helperText = 'Avoid common word-plus-year combinations.';
  }

  if (/(.)\1{2,}/u.test(loweredPassword) || uniqueRatio < 0.45) {
    score -= 10;
    helperText = 'Avoid repeated characters or overly similar patterns.';
  }

  if (hasSequentialPattern(loweredPassword)) {
    score -= 12;
    helperText = 'Avoid sequences like 1234, abcd, or qwerty.';
  }

  if (
    containsPersonalInfo({
      password: loweredPassword,
      email: normalizedEmail,
      name: normalizedName,
    })
  ) {
    score -= 18;
    helperText = 'Avoid using your name or email in the password.';
  }

  if (trimmedPassword.length >= minLength + 4) {
    score += 8;
  }

  if (trimmedPassword.length >= minLength + 8) {
    score += 8;
  }

  const boundedScore = Math.max(0, Math.min(score, 100));
  const progress = Math.max(0.15, Math.min(boundedScore / 100, 1));

  if (boundedScore < 40) {
    return {
      level: 'weak',
      progress,
      label: 'Weak',
      helperText,
    };
  }

  if (boundedScore < 60) {
    return {
      level: 'fair',
      progress,
      label: 'Fair',
      helperText,
    };
  }

  if (boundedScore < 80) {
    return {
      level: 'good',
      progress,
      label: 'Good',
      helperText: 'Good start. Extra length still helps the most.',
    };
  }

  return {
    level: 'strong',
    progress,
    label: 'Strong',
    helperText: 'Strong choice. Long, unique passwords are hardest to guess.',
  };
}

export async function checkPasswordAgainstPwnedPasswords(
  password: string,
): Promise<PasswordBreachCheckResult> {
  const passwordHash = await sha1Hex(password);
  const hash = passwordHash.toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: {
      'Add-Padding': 'true',
      'User-Agent': 'react-auth-flow',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Pwned Passwords lookup failed with status ${response.status}`,
    );
  }

  const body = await response.text();
  const lines = body.split(/\r?\n/u);

  for (const line of lines) {
    if (!line) {
      continue;
    }

    const [lineSuffix, countText] = line.split(':');
    if (lineSuffix === suffix) {
      const exposureCount = Number.parseInt(countText ?? '0', 10) || 0;
      if (exposureCount > 0) {
        return pwnedPasswordBreachCheckResult(exposureCount);
      }
    }
  }

  return safePasswordBreachCheckResult();
}

function containsPersonalInfo(input: {
  password: string;
  email: string;
  name: string;
}): boolean {
  const { password, email, name } = input;
  const tokens = new Set([
    ...name.split(/\s+/u).filter((part) => part.length >= 3),
    ...email.split(/[@._\-+]/u).filter((part) => part.length >= 3),
  ]);

  return Array.from(tokens).some((token) => password.includes(token));
}

function hasSequentialPattern(value: string): boolean {
  if (value.length < 4) {
    return false;
  }

  const sequences = [
    '0123456789',
    '9876543210',
    'abcdefghijklmnopqrstuvwxyz',
    'zyxwvutsrqponmlkjihgfedcba',
    'qwertyuiop',
    'poiuytrewq',
    'asdfghjkl',
    'lkjhgfdsa',
    'zxcvbnm',
    'mnbvcxz',
  ];

  return sequences.some((sequence) => {
    for (let index = 0; index <= sequence.length - 4; index += 1) {
      if (value.includes(sequence.slice(index, index + 4))) {
        return true;
      }
    }

    return false;
  });
}

async function sha1Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);

  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest('SHA-1', bytes);
    return bufferToHex(new Uint8Array(digest));
  }

  throw new Error('Web Crypto is not available in this environment.');
}

function bufferToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
