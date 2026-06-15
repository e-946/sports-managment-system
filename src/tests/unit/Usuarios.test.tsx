import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Usuarios } from '../../pages/admin/Usuarios';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock useAuth
let mockUser = { id: 'admin-1', role: 'ADMIN_GERAL' };
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser
  })
}));

describe('Usuarios Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: 'admin-1', role: 'ADMIN_GERAL' };
  });

  it('renders all role options for ADMIN_GERAL', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    const { container } = render(<Usuarios />);

    expect(screen.getByText('Cadastrar Novo Usuário')).toBeInTheDocument();

    const roleSelect = container.querySelector('select');
    expect(roleSelect).toBeInTheDocument();

    if (roleSelect) {
      const options = Array.from(roleSelect.querySelectorAll('option')).map(o => o.value);
      expect(options).toContain('ADMIN_GERAL');
      expect(options).toContain('MANAGER');
      expect(options).toContain('MODERADOR');
    }
  });

  it('restricts role options and filters list for MANAGER', async () => {
    mockUser = { id: 'manager-1', role: 'MANAGER' };

    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    const { container } = render(<Usuarios />);

    const roleSelect = container.querySelector('select');
    expect(roleSelect).toBeInTheDocument();

    if (roleSelect) {
      const options = Array.from(roleSelect.querySelectorAll('option')).map(o => o.value);
      // Manager should only be able to create Moderador
      expect(options).not.toContain('ADMIN_GERAL');
      expect(options).not.toContain('MANAGER');
      expect(options).toContain('MODERADOR');
    }
  });

  it('shows trash button only for allowed delete targets', async () => {
    mockUser = { id: 'admin-1', role: 'ADMIN_GERAL' };

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'admin-1', nome: 'Admin Geral (Self)', cpf: '1', role: 'ADMIN_GERAL', delegacaoNome: '-' },
          { id: 'manager-2', nome: 'Manager User', cpf: '2', role: 'MANAGER', delegacaoNome: '-' }
        ]
      })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    const { container } = render(<Usuarios />);

    await waitFor(() => {
      expect(screen.getByText('Admin Geral (Self)')).toBeInTheDocument();
      expect(screen.getByText('Manager User')).toBeInTheDocument();
    });

    // There should only be one trash icon (for the manager-2, since admin-1 is self)
    const trashButtons = container.querySelectorAll('button.hover\\:text-red-600');
    expect(trashButtons).toHaveLength(1);
  });

  it('allows editing a user without cpf in the payload', async () => {
    mockUser = { id: 'admin-1', role: 'ADMIN_GERAL' };

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'user-1', nome: 'User One', cpf: '12345678901', role: 'MANAGER', delegacaoNome: '-' }
        ]
      })
      .mockResolvedValueOnce({ ok: true, json: async () => [] }); // delegacoes

    const { container } = render(<Usuarios />);

    await waitFor(() => {
      expect(screen.getByText('User One')).toBeInTheDocument();
    });

    // Mock the PUT request
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    // Mock the subsequent GET requests after reload
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => [] });
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => [] });

    // Click edit button
    const editButton = container.querySelector('button.hover\\:text-indigo-600');
    expect(editButton).toBeInTheDocument();
    fireEvent.click(editButton!);

    await waitFor(() => {
      expect(screen.getByText('Editar Usuário')).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Salvar Alterações');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/usuarios/user-1', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          nome: 'User One',
          role: 'MANAGER',
          delegacaoId: ''
        })
      }));
    });
  });
});
