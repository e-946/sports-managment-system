import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Delegacoes } from '../../pages/admin/Delegacoes';
import { vi, describe, it, expect, beforeEach } from 'vitest';

let mockUser = { id: 'admin-1', role: 'ADMIN_GERAL' };
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser
  })
}));

describe('Delegacoes Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: 'admin-1', role: 'ADMIN_GERAL' };
    
    global.fetch = vi.fn().mockImplementation((url) => {
      return Promise.resolve({ ok: true, json: async () => [
        { id: 'del-1', nome: 'Brasil' }
      ]});
    });
  });

  it('renders delegations list and form', async () => {
    render(<Delegacoes />);
    
    await waitFor(() => {
      expect(screen.getByText('Brasil')).toBeInTheDocument();
      expect(screen.getByText('Cadastrar Delegação')).toBeInTheDocument();
    });
  });
});
