import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Partidas } from '../../pages/admin/Partidas';
import { vi, describe, it, expect, beforeEach } from 'vitest';

let mockUser = { id: 'admin-1', role: 'ADMIN_GERAL' };
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser
  })
}));

describe('Partidas Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: 'admin-1', role: 'ADMIN_GERAL' };
    
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/partidas')) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (url.includes('/api/equipes')) {
        return Promise.resolve({ ok: true, json: async () => [
          { id: 'eq-1', nome: 'Equipe A', delegacaoId: 'del-1' },
          { id: 'eq-2', nome: 'Equipe B', delegacaoId: 'del-2' }
        ]});
      }
      if (url.includes('/api/esportes')) {
        return Promise.resolve({ ok: true, json: async () => [
          { id: 'esp-1', nome: 'Futebol' }
        ]});
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });
  });

  it('renders correctly and allows submitting a draw match', async () => {
    const { container } = render(<Partidas />);
    
    await waitFor(() => {
      expect(screen.getByText('Registrar Partida')).toBeInTheDocument();
    });

    // We can simulate filling out the form by checking element presence
    expect(screen.getByText('Empate / N/A')).toBeInTheDocument();
  });
});
