import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from 'react';
import type {
  AuthFlowProps,
  AuthFlowRenderContext,
  AuthFlowTheme,
  AuthMode,
  ModeSwitcherRenderProps,
} from './types';
import { AuthFlowType } from './types';
import './styles.css';

type FieldName = 'name' | 'email' | 'password' | 'confirmPassword';

interface FormFields {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type FieldErrors = Partial<Record<FieldName, string>>;

const INITIAL_FIELDS: FormFields = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const LIGHT_TOKENS = {
  background: '#ffffff',
  inputFill: '#f6f8fb',
  surfaceBorder: 'rgba(15, 23, 42, 0.08)',
  inputBorder: 'rgba(15, 23, 42, 0.12)',
  text: '#0f172a',
  mutedText: '#64748b',
  primary: '#2563eb',
  error: '#dc2626',
  shadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
};

const DARK_TOKENS = {
  background: '#0f172a',
  inputFill: '#172033',
  surfaceBorder: 'rgba(148, 163, 184, 0.16)',
  inputBorder: 'rgba(148, 163, 184, 0.22)',
  text: '#e2e8f0',
  mutedText: '#94a3b8',
  primary: '#60a5fa',
  error: '#f87171',
  shadow: '0 18px 40px rgba(2, 6, 23, 0.36)',
};

const MODE_CONTENT: Record<
  AuthMode,
  { title: string; subtitle: string; submitLabel: string }
> = {
  signIn: {
    title: 'Welcome back',
    subtitle: 'Sign in to your account',
    submitLabel: 'Sign In',
  },
  signUp: {
    title: 'Create account',
    subtitle: 'Join us today',
    submitLabel: 'Create Account',
  },
  forgotPassword: {
    title: 'Reset password',
    subtitle: "We'll send you a reset link",
    submitLabel: 'Send Reset Link',
  },
};

function resolveInitialMode(
  authFlowType: AuthFlowType,
  initialMode?: AuthMode,
): AuthMode {
  if (initialMode && authFlowType.hasMode(initialMode)) {
    return initialMode;
  }

  return authFlowType.defaultMode;
}

function toFriendlyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(/^(Exception|Error):\s*/u, '');
  }

  return String(error).replace(/^(Exception|Error):\s*/u, '');
}

function validateEmail(email: string): boolean {
  return /^[^@]+@[^@]+\.[^@]+$/u.test(email.trim());
}

function validateFields(mode: AuthMode, fields: FormFields): FieldErrors {
  const errors: FieldErrors = {};

  if (mode === 'signUp') {
    if (!fields.name.trim()) {
      errors.name = 'Name is required';
    }
  }

  if (!fields.email.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(fields.email)) {
    errors.email = 'Enter a valid email';
  }

  if (mode !== 'forgotPassword') {
    if (!fields.password) {
      errors.password = 'Password is required';
    } else if (mode === 'signUp' && fields.password.length < 8) {
      errors.password = 'Minimum 8 characters';
    }
  }

  if (mode === 'signUp') {
    if (!fields.confirmPassword) {
      errors.confirmPassword = 'Please confirm password';
    } else if (fields.confirmPassword !== fields.password) {
      errors.confirmPassword = 'Passwords do not match';
    }
  }

  return errors;
}

function getForgotPasswordLink(mode: AuthMode, authFlowType: AuthFlowType) {
  return (
    mode === 'signIn' &&
    authFlowType.hasMode('forgotPassword') && {
      label: 'Forgot password?',
      mode: 'forgotPassword' as const,
    }
  );
}

function getModeSwitcherLinks(
  mode: AuthMode,
  authFlowType: AuthFlowType,
): ModeSwitcherRenderProps['links'] {
  if (mode === 'signIn' && authFlowType.hasMode('signUp')) {
    return [{ prompt: "Don't have an account?", label: 'Sign up', mode: 'signUp' }];
  }

  if (mode === 'signUp' && authFlowType.hasMode('signIn')) {
    return [
      {
        prompt: 'Already have an account?',
        label: 'Sign in',
        mode: 'signIn',
      },
    ];
  }

  if (mode === 'forgotPassword' && authFlowType.hasMode('signIn')) {
    return [
      {
        prompt: 'Remember your password?',
        label: 'Sign in',
        mode: 'signIn',
      },
    ];
  }

  return [];
}

function useResolvedThemeMode(themeMode: AuthFlowTheme['themeMode']) {
  const [prefersDark, setPrefersDark] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (
      themeMode &&
      themeMode !== 'system' &&
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function'
    ) {
      return undefined;
    }

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event: MediaQueryListEvent) => {
      setPrefersDark(event.matches);
    };

    setPrefersDark(mediaQuery.matches);
    mediaQuery.addEventListener('change', listener);

    return () => mediaQuery.removeEventListener('change', listener);
  }, [themeMode]);

  if (themeMode === 'dark') {
    return 'dark';
  }

  if (themeMode === 'light') {
    return 'light';
  }

  return prefersDark ? 'dark' : 'light';
}

function defaultFieldProps(theme?: AuthFlowTheme) {
  return {
    borderRadius: theme?.inputBorderRadius ?? 12,
    ...theme?.inputStyle,
  };
}

function DefaultSpinner() {
  return <span className="raf__spinner" aria-hidden="true" />;
}

function AuthField(props: {
  name: FieldName;
  label: string;
  value: string;
  type?: string;
  autoComplete?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  theme?: AuthFlowTheme;
}) {
  const {
    name,
    label,
    value,
    type = 'text',
    autoComplete,
    onChange,
    onBlur,
    error,
    theme,
  } = props;

  return (
    <label className="raf__field">
      <span className="raf__field-label">{label}</span>
      <input
        className="raf__input"
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        style={defaultFieldProps(theme)}
      />
      {error ? (
        <span id={`${name}-error`} className="raf__field-error">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function DefaultModeSwitcher(props: {
  links: ModeSwitcherRenderProps['links'];
  switchMode: (mode: AuthMode) => void;
  theme?: AuthFlowTheme;
}) {
  const { links, switchMode, theme } = props;

  if (links.length === 0) {
    return null;
  }

  const [link] = links;

  return (
    <div className="raf__mode-switcher">
      <span>{link.prompt} </span>
      <button
        type="button"
        className="raf__inline-button"
        onClick={() => switchMode(link.mode)}
        style={theme?.linkStyle}
      >
        {link.label}
      </button>
    </div>
  );
}

function modeClassName(base: string, extra?: string) {
  return extra ? `${base} ${extra}` : base;
}

export function AuthFlow(props: AuthFlowProps) {
  const {
    authFlowType = AuthFlowType.all(),
    onSignIn,
    onSignUp,
    onForgotPassword,
    onSignInSuccess,
    onSignUpSuccess,
    onForgotPasswordSuccess,
    isLoading,
    errorMessage,
    initialMode,
    theme,
    className,
    headerRenderer,
    footerRenderer,
    errorRenderer,
    loadingRenderer,
    submitButtonRenderer,
    modeSwitcherRenderer,
  } = props;

  const [mode, setMode] = useState<AuthMode>(() =>
    resolveInitialMode(authFlowType, initialMode),
  );
  const [fields, setFields] = useState<FormFields>(INITIAL_FIELDS);
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const resolvedThemeMode = useResolvedThemeMode(theme?.themeMode);
  const effectiveLoading = isLoading ?? internalLoading;
  const effectiveError = errorMessage ?? internalError;
  const fieldErrors = useMemo(() => validateFields(mode, fields), [mode, fields]);
  const forgotPasswordLink = getForgotPasswordLink(mode, authFlowType);
  const modeLinks = getModeSwitcherLinks(mode, authFlowType);

  useEffect(() => {
    if (!authFlowType.hasMode(mode)) {
      setMode(resolveInitialMode(authFlowType, initialMode));
      setFields(INITIAL_FIELDS);
      setTouched({});
      setSubmitted(false);
      setInternalError(null);
    }
  }, [authFlowType, initialMode, mode]);

  const switchMode = useCallback(
    (nextMode: AuthMode) => {
      if (!authFlowType.hasMode(nextMode)) {
        return;
      }

      setMode(nextMode);
      setFields(INITIAL_FIELDS);
      setTouched({});
      setSubmitted(false);
      setInternalError(null);
    },
    [authFlowType],
  );

  const renderContext: AuthFlowRenderContext = useMemo(
    () => ({
      mode,
      switchMode,
      isLoading: effectiveLoading,
      errorMessage: effectiveError,
      theme,
      authFlowType,
    }),
    [authFlowType, effectiveError, effectiveLoading, mode, switchMode, theme],
  );

  const setField = useCallback((name: FieldName, value: string) => {
    setFields((current) => ({
      ...current,
      [name]: value,
    }));
  }, []);

  const showFieldError = useCallback(
    (name: FieldName) => {
      if (!submitted && !touched[name]) {
        return undefined;
      }

      return fieldErrors[name];
    },
    [fieldErrors, submitted, touched],
  );

  const markTouched = useCallback((name: FieldName) => {
    setTouched((current) => ({ ...current, [name]: true }));
  }, []);

  const requireHandler = useCallback(
    (currentMode: AuthMode) => {
      switch (currentMode) {
        case 'signIn':
          if (!onSignIn) {
            throw new Error('onSignIn is required when signIn mode is enabled.');
          }
          return onSignIn(fields.email.trim(), fields.password);
        case 'signUp':
          if (!onSignUp) {
            throw new Error('onSignUp is required when signUp mode is enabled.');
          }
          return onSignUp(fields.email.trim(), fields.password, fields.name.trim());
        case 'forgotPassword':
          if (!onForgotPassword) {
            throw new Error(
              'onForgotPassword is required when forgotPassword mode is enabled.',
            );
          }
          return onForgotPassword(fields.email.trim());
      }
    },
    [fields.email, fields.name, fields.password, onForgotPassword, onSignIn, onSignUp],
  );

  const runSuccessCallback = useCallback(() => {
    switch (mode) {
      case 'signIn':
        onSignInSuccess?.();
        break;
      case 'signUp':
        onSignUpSuccess?.();
        break;
      case 'forgotPassword':
        onForgotPasswordSuccess?.();
        break;
    }
  }, [mode, onForgotPasswordSuccess, onSignInSuccess, onSignUpSuccess]);

  const submit = useCallback(async () => {
    setSubmitted(true);

    const errors = validateFields(mode, fields);
    if (Object.keys(errors).length > 0 || effectiveLoading) {
      return;
    }

    setInternalError(null);
    setInternalLoading(true);

    try {
      await Promise.resolve(requireHandler(mode));
      runSuccessCallback();
    } catch (error) {
      setInternalError(toFriendlyError(error));
    } finally {
      setInternalLoading(false);
    }
  }, [effectiveLoading, fields, mode, requireHandler, runSuccessCallback]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void submit();
    },
    [submit],
  );

  const tokens = resolvedThemeMode === 'dark' ? DARK_TOKENS : LIGHT_TOKENS;
  const themeStyles = {
    '--raf-background': theme?.backgroundColor ?? tokens.background,
    '--raf-input-fill': theme?.inputFillColor ?? tokens.inputFill,
    '--raf-text': tokens.text,
    '--raf-muted-text': tokens.mutedText,
    '--raf-primary': theme?.primaryColor ?? tokens.primary,
    '--raf-error': theme?.errorColor ?? tokens.error,
    '--raf-surface-border': tokens.surfaceBorder,
    '--raf-input-border': tokens.inputBorder,
    '--raf-shadow': tokens.shadow,
    '--raf-transition-duration': `${theme?.transitionDuration ?? 320}ms`,
    '--raf-transition-timing':
      theme?.transitionTimingFunction ?? 'cubic-bezier(0.4, 0, 0.2, 1)',
  } as CSSProperties;

  const currentContent = MODE_CONTENT[mode];
  const loadingIndicator: ReactNode = loadingRenderer
    ? loadingRenderer(renderContext)
    : <DefaultSpinner />;

  return (
    <div
      className={modeClassName(
        `raf raf--${resolvedThemeMode}`,
        className,
      )}
      style={themeStyles}
    >
      <div className="raf__card" style={theme?.cardStyle}>
        {headerRenderer ? (
          headerRenderer(renderContext)
        ) : (
          <header className="raf__header">
            <h2 className="raf__title" style={theme?.titleStyle}>
              {currentContent.title}
            </h2>
            <p className="raf__subtitle" style={theme?.subtitleStyle}>
              {currentContent.subtitle}
            </p>
          </header>
        )}

        {effectiveError ? (
          <div className="raf__error-shell" aria-live="polite">
            {errorRenderer ? (
              errorRenderer({ ...renderContext, error: effectiveError })
            ) : (
              <div className="raf__error">
                <strong className="raf__error-icon" aria-hidden="true">
                  !
                </strong>
                <span>{effectiveError}</span>
              </div>
            )}
          </div>
        ) : null}

        <div className="raf__panel" key={mode}>
          <form className="raf__form" onSubmit={handleSubmit}>
            {mode === 'signUp' ? (
              <AuthField
                name="name"
                label="Full name"
                value={fields.name}
                autoComplete="name"
                onChange={(value) => setField('name', value)}
                onBlur={() => markTouched('name')}
                error={showFieldError('name')}
                theme={theme}
              />
            ) : null}

            <AuthField
              name="email"
              label="Email"
              type="email"
              value={fields.email}
              autoComplete={mode === 'signUp' ? 'email' : 'username'}
              onChange={(value) => setField('email', value)}
              onBlur={() => markTouched('email')}
              error={showFieldError('email')}
              theme={theme}
            />

            {mode !== 'forgotPassword' ? (
              <AuthField
                name="password"
                label="Password"
                type="password"
                value={fields.password}
                autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
                onChange={(value) => setField('password', value)}
                onBlur={() => markTouched('password')}
                error={showFieldError('password')}
                theme={theme}
              />
            ) : null}

            {mode === 'signUp' ? (
              <AuthField
                name="confirmPassword"
                label="Confirm password"
                type="password"
                value={fields.confirmPassword}
                autoComplete="new-password"
                onChange={(value) => setField('confirmPassword', value)}
                onBlur={() => markTouched('confirmPassword')}
                error={showFieldError('confirmPassword')}
                theme={theme}
              />
            ) : null}

            {forgotPasswordLink ? (
              <div className="raf__forgot-shell">
                <button
                  type="button"
                  className="raf__inline-button"
                  onClick={() => switchMode(forgotPasswordLink.mode)}
                  style={theme?.linkStyle}
                >
                  {forgotPasswordLink.label}
                </button>
              </div>
            ) : null}

            {submitButtonRenderer ? (
              submitButtonRenderer({
                ...renderContext,
                label: currentContent.submitLabel,
                submit: () => {
                  void submit();
                },
              })
            ) : (
              <button
                type="submit"
                className="raf__submit"
                disabled={effectiveLoading}
                style={{
                  borderRadius: theme?.buttonBorderRadius ?? 12,
                  ...theme?.buttonStyle,
                }}
              >
                {effectiveLoading ? (
                  loadingIndicator
                ) : (
                  <span style={theme?.buttonTextStyle}>
                    {currentContent.submitLabel}
                  </span>
                )}
              </button>
            )}

            {modeLinks.length > 0 ? (
              modeSwitcherRenderer ? (
                modeSwitcherRenderer({
                  ...renderContext,
                  links: modeLinks,
                })
              ) : (
                <DefaultModeSwitcher
                  links={modeLinks}
                  switchMode={switchMode}
                  theme={theme}
                />
              )
            ) : null}
          </form>
        </div>

        {footerRenderer ? footerRenderer(renderContext) : null}
      </div>
    </div>
  );
}
