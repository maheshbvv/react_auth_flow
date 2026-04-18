import type { CSSProperties, ReactNode } from 'react';

export type AuthMode = 'signIn' | 'signUp' | 'forgotPassword';
export type ThemeMode = 'system' | 'light' | 'dark';
export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export const AUTH_MODE_ORDER: readonly AuthMode[] = [
  'signIn',
  'signUp',
  'forgotPassword',
];

export interface PasswordStrengthResult {
  level: PasswordStrength;
  progress: number;
  label: string;
  helperText: string;
}

export interface PasswordBreachCheckResult {
  isPwned: boolean;
  exposureCount: number;
}

export type PasswordBreachChecker = (
  password: string,
) => Promise<PasswordBreachCheckResult>;

export interface PasswordPolicy {
  showStrengthIndicator?: boolean;
  minLength?: number;
  enablePwnedCheck?: boolean;
  blockPwnedPasswords?: boolean;
  breachChecker?: PasswordBreachChecker;
}

export class AuthFlowType {
  readonly enabledModes: ReadonlySet<AuthMode>;

  constructor(options?: { enabledModes?: Iterable<AuthMode> }) {
    const modes = new Set(options?.enabledModes ?? AUTH_MODE_ORDER);
    if (modes.size === 0) {
      throw new Error('AuthFlowType requires at least one enabled mode.');
    }
    this.enabledModes = modes;
  }

  static all(): AuthFlowType {
    return new AuthFlowType();
  }

  static signInOnly(): AuthFlowType {
    return new AuthFlowType({ enabledModes: ['signIn'] });
  }

  static signUpOnly(): AuthFlowType {
    return new AuthFlowType({ enabledModes: ['signUp'] });
  }

  static forgotPasswordOnly(): AuthFlowType {
    return new AuthFlowType({ enabledModes: ['forgotPassword'] });
  }

  static signInAndSignUp(): AuthFlowType {
    return new AuthFlowType({ enabledModes: ['signIn', 'signUp'] });
  }

  static signInAndForgotPassword(): AuthFlowType {
    return new AuthFlowType({ enabledModes: ['signIn', 'forgotPassword'] });
  }

  static signUpAndForgotPassword(): AuthFlowType {
    return new AuthFlowType({ enabledModes: ['signUp', 'forgotPassword'] });
  }

  hasMode(mode: AuthMode): boolean {
    return this.enabledModes.has(mode);
  }

  get isSingleMode(): boolean {
    return this.enabledModes.size === 1;
  }

  get singleMode(): AuthMode | null {
    return this.isSingleMode ? this.defaultMode : null;
  }

  get defaultMode(): AuthMode {
    return (
      AUTH_MODE_ORDER.find((mode) => this.enabledModes.has(mode)) ??
      'forgotPassword'
    );
  }
}

export interface AuthFlowTheme {
  themeMode?: ThemeMode;
  primaryColor?: string;
  backgroundColor?: string;
  inputFillColor?: string;
  errorColor?: string;
  titleStyle?: CSSProperties;
  subtitleStyle?: CSSProperties;
  inputStyle?: CSSProperties;
  buttonTextStyle?: CSSProperties;
  linkStyle?: CSSProperties;
  inputBorderRadius?: number | string;
  buttonBorderRadius?: number | string;
  buttonStyle?: CSSProperties;
  cardStyle?: CSSProperties;
  transitionDuration?: number;
  transitionTimingFunction?: CSSProperties['transitionTimingFunction'];
}

export interface AuthFlowRenderContext {
  mode: AuthMode;
  switchMode: (mode: AuthMode) => void;
  isLoading: boolean;
  errorMessage: string | null;
  theme?: AuthFlowTheme;
  authFlowType: AuthFlowType;
}

export interface HeaderRenderProps extends AuthFlowRenderContext {}
export interface FooterRenderProps extends AuthFlowRenderContext {}

export interface ErrorRenderProps extends AuthFlowRenderContext {
  error: string;
}

export interface SubmitButtonRenderProps extends AuthFlowRenderContext {
  label: string;
  submit: () => void;
}

export interface ModeSwitcherRenderProps extends AuthFlowRenderContext {
  links: Array<{
    mode: AuthMode;
    label: string;
    prompt: string;
  }>;
}

export interface AuthFlowProps {
  authFlowType?: AuthFlowType;
  onSignIn?: (email: string, password: string) => Promise<void> | void;
  onSignUp?: (
    email: string,
    password: string,
    name: string,
  ) => Promise<void> | void;
  onForgotPassword?: (email: string) => Promise<void> | void;
  onSignInSuccess?: () => void;
  onSignUpSuccess?: () => void;
  onForgotPasswordSuccess?: () => void;
  isLoading?: boolean;
  errorMessage?: string | null;
  initialMode?: AuthMode;
  theme?: AuthFlowTheme;
  passwordPolicy?: PasswordPolicy;
  className?: string;
  headerBuilder?: (props: HeaderRenderProps) => ReactNode;
  footerBuilder?: (props: FooterRenderProps) => ReactNode;
  errorBuilder?: (props: ErrorRenderProps) => ReactNode;
  loadingBuilder?: (props: AuthFlowRenderContext) => ReactNode;
  submitButtonBuilder?: (props: SubmitButtonRenderProps) => ReactNode;
  modeSwitcherBuilder?: (props: ModeSwitcherRenderProps) => ReactNode;
  headerRenderer?: (props: HeaderRenderProps) => ReactNode;
  footerRenderer?: (props: FooterRenderProps) => ReactNode;
  errorRenderer?: (props: ErrorRenderProps) => ReactNode;
  loadingRenderer?: (props: AuthFlowRenderContext) => ReactNode;
  submitButtonRenderer?: (props: SubmitButtonRenderProps) => ReactNode;
  modeSwitcherRenderer?: (props: ModeSwitcherRenderProps) => ReactNode;
}
