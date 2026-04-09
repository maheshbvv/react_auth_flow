import { createContext, useContext, type ReactNode } from 'react';

interface DemoUser {
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
}

export interface DemoAuthResult {
  email: string;
  name: string;
}

export class DemoAuthException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DemoAuthException';
  }
}

function hashPassword(password: string): string {
  const bytes = new TextEncoder().encode(password);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(binary);
  }

  const bufferCtor = (
    globalThis as typeof globalThis & {
      Buffer?: {
        from(input: Uint8Array): { toString(encoding: string): string };
      };
    }
  ).Buffer;

  if (bufferCtor) {
    return bufferCtor.from(bytes).toString('base64');
  }

  return binary;
}

function randomDelay(): number {
  return 1000 + (Date.now() % 1000);
}

function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, milliseconds);
  });
}

export class DemoAuthService {
  private readonly users = new Map<string, DemoUser>();

  async signIn(email: string, password: string): Promise<DemoAuthResult> {
    await wait(randomDelay());

    const normalizedEmail = normalizeEmail(email);
    const user = this.users.get(normalizedEmail);

    if (!user || user.passwordHash !== hashPassword(password)) {
      throw new DemoAuthException('Invalid email or password');
    }

    return { email: user.email, name: user.name };
  }

  async signUp(
    email: string,
    password: string,
    name: string,
  ): Promise<DemoAuthResult> {
    await wait(randomDelay());

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      throw new DemoAuthException('Please enter a valid email address');
    }

    if (password.length < 8) {
      throw new DemoAuthException('Password must be at least 8 characters');
    }

    if (this.users.has(normalizedEmail)) {
      throw new DemoAuthException('Email already in use');
    }

    const user: DemoUser = {
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      name: name.trim(),
      createdAt: new Date(),
    };

    this.users.set(normalizedEmail, user);
    return { email: user.email, name: user.name };
  }

  async forgotPassword(email: string): Promise<void> {
    await wait(1000);

    if (!isValidEmail(normalizeEmail(email))) {
      throw new DemoAuthException('Please enter a valid email address');
    }
  }

  clearUsers(): void {
    this.users.clear();
  }

  get userCount(): number {
    return this.users.size;
  }

  getCreatedAt(email: string): Date | null {
    return this.users.get(normalizeEmail(email))?.createdAt ?? null;
  }
}

const DemoAuthServiceContext = createContext<DemoAuthService | null>(null);

export function DemoAuthServiceProvider(props: {
  service: DemoAuthService;
  children: ReactNode;
}) {
  const { service, children } = props;

  return (
    <DemoAuthServiceContext.Provider value={service}>
      {children}
    </DemoAuthServiceContext.Provider>
  );
}

export function useDemoAuthService(): DemoAuthService {
  const service = useContext(DemoAuthServiceContext);

  if (!service) {
    throw new Error(
      'useDemoAuthService() must be used inside a DemoAuthServiceProvider.',
    );
  }

  return service;
}

export function useMaybeDemoAuthService(): DemoAuthService | null {
  return useContext(DemoAuthServiceContext);
}
