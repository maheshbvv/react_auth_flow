import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import {
  DemoAuthException,
  DemoAuthService,
  DemoAuthServiceProvider,
  useDemoAuthService,
} from '../index';

describe('DemoAuthService', () => {
  test('signs up and signs in users', async () => {
    vi.useFakeTimers();
    const service = new DemoAuthService();

    const signUpPromise = service.signUp(
      'jane@example.com',
      'password123',
      'Jane',
    );
    await vi.runAllTimersAsync();
    await expect(signUpPromise).resolves.toEqual({
      email: 'jane@example.com',
      name: 'Jane',
    });

    const signInPromise = service.signIn('jane@example.com', 'password123');
    await vi.runAllTimersAsync();
    await expect(signInPromise).resolves.toEqual({
      email: 'jane@example.com',
      name: 'Jane',
    });

    expect(service.userCount).toBe(1);
    expect(service.getCreatedAt('jane@example.com')).toBeInstanceOf(Date);
    vi.useRealTimers();
  });

  test('throws friendly errors for invalid credentials', async () => {
    vi.useFakeTimers();
    const service = new DemoAuthService();

    const promise = service
      .signIn('missing@example.com', 'password123')
      .catch((error) => error);
    await vi.runAllTimersAsync();

    const error = await promise;
    expect(error).toBeInstanceOf(DemoAuthException);
    expect(error).toMatchObject({
      message: 'Invalid email or password',
    });
    vi.useRealTimers();
  });

  test('provides the service through context', () => {
    const service = new DemoAuthService();

    function Consumer() {
      const authService = useDemoAuthService();
      return <div>Users: {authService.userCount}</div>;
    }

    render(
      <DemoAuthServiceProvider service={service}>
        <Consumer />
      </DemoAuthServiceProvider>,
    );

    expect(screen.getByText('Users: 0')).toBeInTheDocument();
  });
});
