import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Login } from '../../pages/Login';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock useAuth hook
const mockLogin = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin
  })
}));

describe('Login Component', () => {
  it('renders login form inputs and button correctly', () => {
    const { container } = render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText(/Digite seu CPF/i)).toBeInTheDocument();
    expect(container.querySelector('input[type="password"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar no Sistema/i })).toBeInTheDocument();
  });

  it('allows user to type CPF and password', () => {
    const { container } = render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const cpfInput = screen.getByPlaceholderText(/Digite seu CPF/i) as HTMLInputElement;
    const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement;

    fireEvent.change(cpfInput, { target: { value: '12345678901' } });
    fireEvent.change(passwordInput, { target: { value: 'mypassword' } });

    expect(cpfInput.value).toBe('12345678901');
    expect(passwordInput.value).toBe('mypassword');
  });

  it('displays error message on failed login attempt', async () => {
    // Mock global fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Credenciais inválidas' })
    });

    const { container } = render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const cpfInput = screen.getByPlaceholderText(/Digite seu CPF/i);
    const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement;

    fireEvent.change(cpfInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar no Sistema/i }));

    await waitFor(() => {
      expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument();
    });
  });
});
