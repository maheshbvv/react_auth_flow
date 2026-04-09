import type { ComponentProps } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { AuthFlow, AuthFlowType } from '../index';

function renderFlow(props: Partial<ComponentProps<typeof AuthFlow>> = {}) {
  return render(
    <AuthFlow
      onSignIn={async () => {}}
      onSignUp={async () => {}}
      onForgotPassword={async () => {}}
      {...props}
    />,
  );
}

describe('AuthFlow', () => {
  test('renders sign-in fields and validates empty submit', async () => {
    const user = userEvent.setup();

    renderFlow();
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  test('switches to forgot-password and sign-up modes', async () => {
    const user = userEvent.setup();

    renderFlow();

    await user.click(screen.getByRole('button', { name: 'Forgot password?' }));
    expect(
      screen.getByRole('button', { name: 'Send Reset Link' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(
      screen.getByRole('button', { name: 'Create Account' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Full name')).toBeInTheDocument();
  });

  test('validates password mismatch in sign-up mode', async () => {
    const user = userEvent.setup();

    renderFlow({
      initialMode: 'signUp',
      authFlowType: AuthFlowType.signInAndSignUp(),
    });

    await user.type(screen.getByLabelText('Full name'), 'Jane');
    await user.type(screen.getByLabelText('Email'), 'jane@test.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'different');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  test('displays thrown callback errors and external error overrides', async () => {
    const user = userEvent.setup();
    const onSignIn = vi.fn(async () => {
      throw new Error('Invalid credentials');
    });

    const { rerender } = render(
      <AuthFlow
        onSignIn={onSignIn}
        onSignUp={async () => {}}
        onForgotPassword={async () => {}}
      />,
    );

    await user.type(screen.getByLabelText('Email'), 'x@x.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    rerender(
      <AuthFlow
        onSignIn={async () => {}}
        onSignUp={async () => {}}
        onForgotPassword={async () => {}}
        errorMessage="Session expired"
      />,
    );

    expect(screen.getByText('Session expired')).toBeInTheDocument();
  });

  test('supports custom renderers', async () => {
    const user = userEvent.setup();
    const headerRenderer = vi.fn(({ mode }: { mode: string }) => (
      <div>Custom header: {mode}</div>
    ));
    const submitSpy = vi.fn(async () => {});

    renderFlow({
      onSignIn: submitSpy,
      headerRenderer,
      submitButtonRenderer: ({ submit, label }) => (
        <button type="button" onClick={submit}>
          Custom {label}
        </button>
      ),
    });

    expect(headerRenderer).toHaveBeenCalled();
    expect(screen.getByText('Custom header: signIn')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Email'), 'demo@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Custom Sign In' }));

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledWith('demo@example.com', 'password123');
    });
  });
});
