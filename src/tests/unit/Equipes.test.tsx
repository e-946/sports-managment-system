import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Equipes } from '../../pages/admin/Equipes';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock useAuth
const mockUser = { id: 'admin-1', role: 'ADMIN_GERAL', delegacaoId: '' };
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser
  })
}));

describe('Equipes Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders team page, loads sports, delegations and athletes correctly', async () => {
    // Mock the fetch endpoints
    global.fetch = vi.fn()
      // 1. GET /api/equipes
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'eq-1', nome: 'Dream Team', delegacaoId: 'del-1', delegacaoNome: 'Brasil', esporteId: 'esp-1', esporteNome: 'Futebol', participanteIds: ['p-1'] }
        ]
      })
      // 2. GET /api/esportes
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'esp-1', nome: 'Futebol', categoria: 'MASCULINO', turno: '1', data: '2026-06-01', minParticipantes: 5, maxParticipantes: 11 }
        ]
      })
      // 3. GET /api/participantes
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'p-1', nomeAbreviado: 'Pelé', cpf: '123', idade: 80, sexo: 'MASCULINO', tipo: 'PARTICIPANTE', delegacaoId: 'del-1', delegacaoNome: 'Brasil' }
        ]
      })
      // 4. GET /api/delegacoes
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'del-1', nome: 'Brasil' }
        ]
      });

    render(<Equipes />);

    expect(screen.getByText('Equipes e Atletas')).toBeInTheDocument();
    expect(screen.getByText('Criar Nova Equipe')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Dream Team')).toBeInTheDocument();
      expect(screen.getByText('Pelé')).toBeInTheDocument();
      expect(screen.getByText('1 atleta(s)')).toBeInTheDocument();
    });
  });

  it('toggles athlete checkboxes when creating a team', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 'esp-1', nome: 'Futebol', categoria: 'MASCULINO', minParticipantes: 1, maxParticipantes: 5 }] })
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 'p-1', nomeAbreviado: 'Pelé', delegacaoId: 'del-1', delegacaoNome: 'Brasil', sexo: 'MASCULINO' }] })
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 'del-1', nome: 'Brasil' }] });

    render(<Equipes />);

    await waitFor(() => {
      expect(screen.getByText('Pelé')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    // Toggle participant selected
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);

    // Verify counter updates to "1 / 5"
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
  });
});
