import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Participantes } from '../../pages/admin/Participantes';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock useAuth
const mockUser = { id: 'admin-1', role: 'ADMIN_GERAL', delegacaoId: '' };
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser
  })
}));

describe('Participantes Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders participant page correctly with loaded delegations and participants', async () => {
    // 1. Mock GET participants
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'p-1', nomeCompleto: 'Edson Arantes', nomeAbreviado: 'Pelé', cpf: '12345678901', idade: 80, sexo: 'MASCULINO', tipo: 'PARTICIPANTE', delegacaoId: 'del-1', delegacaoNome: 'Brasil' }
        ]
      })
      // 2. Mock GET delegations
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'del-1', nome: 'Brasil' },
          { id: 'del-2', nome: 'Argentina' }
        ]
      });

    render(<Participantes />);

    expect(screen.getByText('Participantes')).toBeInTheDocument();
    expect(screen.getByText('Novo Participante')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Pelé')).toBeInTheDocument();
      expect(screen.getAllByText('Brasil').length).toBeGreaterThan(0);
      expect(screen.getByText('80 anos')).toBeInTheDocument();
    });
  });

  it('validates and rejects registering a participant younger than 10 years', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 'del-1', nome: 'Brasil' }]
      });

    const { container } = render(<Participantes />);

    await screen.findByText('Nenhum participante cadastrado.');

    const textInputs = container.querySelectorAll('input[type="text"]');
    const nameInput = textInputs[0] as HTMLInputElement;
    const shortNameInput = textInputs[1] as HTMLInputElement;
    const cpfInput = textInputs[2] as HTMLInputElement;
    const cellInput = textInputs[3] as HTMLInputElement;
    const birthInput = container.querySelector('input[type="date"]') as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'Neymar Jr' } });
    fireEvent.change(shortNameInput, { target: { value: 'Neymar' } });
    fireEvent.change(cpfInput, { target: { value: '11111111111' } });
    fireEvent.change(birthInput, { target: { value: '2020-01-01' } }); // Under 10 years old!
    fireEvent.change(cellInput, { target: { value: '11999999999' } });

    fireEvent.click(screen.getByRole('button', { name: /Cadastrar Participante/i }));

    await waitFor(() => {
      expect(screen.getByText('Participante deve ter 10 anos ou mais.')).toBeInTheDocument();
    });
  });
});
