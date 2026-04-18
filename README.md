# react-auth-flow

Drop-in authentication UI for React with **sign in**, **sign up**, and **forgot password** in one component.

It ports the feature set of the Flutter `flutter_auth_flow` package into a React + TypeScript npm package.

## Features

- Enable only the auth modes you need
- Async callbacks for sign in, sign up, and forgot password
- Success callbacks for each mode
- Internal loading and error state, with external override support
- Built-in validation
- Optional sign-up password strength meter and HIBP breach check
- Animated mode transitions
- Theme tokens for colors, typography, radii, and motion
- Flutter-style builder aliases plus React render-prop customization for header, footer, error, loading, submit button, and mode switcher
- Demo auth service and React provider for local demos/tests

## Installation

```bash
npm i @maheshbvv/react-auth-flow
```

Import the shipped styles once in your app:

```ts
import 'react-auth-flow/styles.css';
```

## Quick start

```tsx
import { AuthFlow } from 'react-auth-flow';
import 'react-auth-flow/styles.css';

export function LoginScreen() {
  return (
    <AuthFlow
      onSignIn={async (email, password) => {
        await api.signIn({ email, password });
      }}
      onSignUp={async (email, password, name) => {
        await api.signUp({ email, password, name });
      }}
      onForgotPassword={async (email) => {
        await api.sendReset(email);
      }}
      onSignInSuccess={() => {
        window.location.assign('/app');
      }}
    />
  );
}
```

## Presets

```tsx
import { AuthFlow, AuthFlowType } from 'react-auth-flow';

<AuthFlow authFlowType={AuthFlowType.signInOnly()} onSignIn={handleSignIn} />;

<AuthFlow
  authFlowType={AuthFlowType.signInAndSignUp()}
  onSignIn={handleSignIn}
  onSignUp={handleSignUp}
/>;

<AuthFlow
  authFlowType={new AuthFlowType({ enabledModes: ['signIn', 'forgotPassword'] })}
  onSignIn={handleSignIn}
  onForgotPassword={handleForgotPassword}
/>;
```

## API

| Prop | Type | Description |
| --- | --- | --- |
| `authFlowType` | `AuthFlowType` | Enabled auth modes. Defaults to all modes. |
| `onSignIn` | `(email, password) => Promise<void> \| void` | Required when sign-in is enabled. |
| `onSignUp` | `(email, password, name) => Promise<void> \| void` | Required when sign-up is enabled. |
| `onForgotPassword` | `(email) => Promise<void> \| void` | Required when forgot-password is enabled. |
| `onSignInSuccess` | `() => void` | Runs after a successful sign in. |
| `onSignUpSuccess` | `() => void` | Runs after a successful sign up. |
| `onForgotPasswordSuccess` | `() => void` | Runs after a successful password reset request. |
| `isLoading` | `boolean` | Overrides internal loading state. |
| `errorMessage` | `string \| null` | Overrides internal error messaging. |
| `initialMode` | `AuthMode` | Starting mode if enabled. |
| `theme` | `AuthFlowTheme` | Visual customization. |
| `passwordPolicy` | `PasswordPolicy` | Optional sign-up password meter and breach policy. |
| `headerBuilder` | `(props) => ReactNode` | Flutter-style alias for `headerRenderer`. |
| `footerBuilder` | `(props) => ReactNode` | Flutter-style alias for `footerRenderer`. |
| `errorBuilder` | `(props) => ReactNode` | Flutter-style alias for `errorRenderer`. |
| `loadingBuilder` | `(props) => ReactNode` | Flutter-style alias for `loadingRenderer`. |
| `submitButtonBuilder` | `(props) => ReactNode` | Flutter-style alias for `submitButtonRenderer`. |
| `modeSwitcherBuilder` | `(props) => ReactNode` | Flutter-style alias for `modeSwitcherRenderer`. |
| `headerRenderer` | `(props) => ReactNode` | Replaces the default header. |
| `footerRenderer` | `(props) => ReactNode` | Renders below the form. |
| `errorRenderer` | `(props) => ReactNode` | Replaces the default error UI. |
| `loadingRenderer` | `(props) => ReactNode` | Replaces the spinner inside the default submit button. |
| `submitButtonRenderer` | `(props) => ReactNode` | Replaces the default submit button. |
| `modeSwitcherRenderer` | `(props) => ReactNode` | Replaces the bottom mode switcher. |

## Password policy

```tsx
import { AuthFlow } from 'react-auth-flow';

<AuthFlow
  authFlowType={AuthFlowType.signInAndSignUp()}
  onSignIn={handleSignIn}
  onSignUp={handleSignUp}
  passwordPolicy={{
    showStrengthIndicator: true,
    minLength: 10,
    enablePwnedCheck: true,
    blockPwnedPasswords: true,
  }}
/>;
```

If the breach lookup fails, sign-up is still allowed and the component shows a warning instead of blocking the user.

The package also exports `evaluatePasswordStrength`, `checkPasswordAgainstPwnedPasswords`, `safePasswordBreachCheckResult`, and `pwnedPasswordBreachCheckResult`.

## Theming

```tsx
<AuthFlow
  onSignIn={handleSignIn}
  onSignUp={handleSignUp}
  onForgotPassword={handleForgotPassword}
  theme={{
    themeMode: 'system',
    primaryColor: '#4f46e5',
    backgroundColor: '#ffffff',
    inputFillColor: '#f8fafc',
    errorColor: '#dc2626',
    titleStyle: { fontSize: '2rem' },
    buttonTextStyle: { letterSpacing: '0.02em' },
    inputBorderRadius: 14,
    buttonBorderRadius: 14,
    transitionDuration: 280,
    transitionTimingFunction: 'ease-in-out',
  }}
/>
```

## Custom renderers

```tsx
<AuthFlow
  onSignIn={handleSignIn}
  onSignUp={handleSignUp}
  onForgotPassword={handleForgotPassword}
  headerRenderer={({ mode }) => <BrandHeader mode={mode} />}
  submitButtonRenderer={({ label, submit, isLoading }) => (
    <MyButton onClick={submit} disabled={isLoading}>
      {label}
    </MyButton>
  )}
  modeSwitcherRenderer={({ links, switchMode }) => (
    <nav>
      {links.map((link) => (
        <button key={link.mode} onClick={() => switchMode(link.mode)}>
          {link.prompt} {link.label}
        </button>
      ))}
    </nav>
  )}
/>
```

## Demo auth service

```tsx
import {
  AuthFlow,
  DemoAuthService,
  DemoAuthServiceProvider,
  useDemoAuthService,
} from 'react-auth-flow';

const service = new DemoAuthService();

function DemoScreen() {
  const auth = useDemoAuthService();

  return (
    <AuthFlow
      onSignIn={(email, password) => auth.signIn(email, password).then(() => {})}
      onSignUp={(email, password, name) =>
        auth.signUp(email, password, name).then(() => {})
      }
      onForgotPassword={(email) => auth.forgotPassword(email)}
    />
  );
}

export function App() {
  return (
    <DemoAuthServiceProvider service={service}>
      <DemoScreen />
    </DemoAuthServiceProvider>
  );
}
```
