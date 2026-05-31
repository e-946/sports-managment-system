import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Esportes } from '../../pages/admin/Esportes';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock useAuth
let mockUser = { id: 'admin-1', role: 'ADMIN_GERAL' };
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser
  })
}));

describe('Esportes Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sports page form and empty state correctly', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    render(<Esportes />);

    expect(screen.getByText('Esportes e Modalidades')).toBeInTheDocument();
    expect(screen.getByText('Novo Esporte')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cadastrar Esporte/i })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Nenhum esporte cadastrado.')).toBeInTheDocument();
    });
  });

  it('renders loaded sports list correctly', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: '1', nome: 'Futebol', categoria: 'MASCULINO', turno: '1', data: '2026-06-01', minParticipantes: 5, maxParticipantes: 11 }
      ]
    });

    render(<Esportes />);

    await waitFor(() => {
      expect(screen.getByText('Futebol')).toBeInTheDocument();
      expect(screen.getByText('MASCULINO')).toBeInTheDocument();
      expect(screen.getAllByText(/1º Turno/i).length).toBeGreaterThan(0);
      expect(screen.getByText('5 a 11 participantes')).toBeInTheDocument();
    });
  });

  it('allows user to input details and submit form successfully', async () => {
    // 1. Mock GET list
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      // 2. Mock POST item
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: '2',
          nome: 'Vôlei',
          categoria: 'FEMININO',
          turno: '2',
          data: '2026-06-02',
          minParticipantes: 6,
          maxParticipantes: 6
        })
      });

    const { container } = render(<Esportes />);

    // Wait for initial fetch
    await screen.findByText('Nenhum esporte cadastrado.');

    const nameInput = screen.getByPlaceholderText(/Ex: Futebol/i) as HTMLInputElement;
    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    const numberInputs = container.querySelectorAll('input[type="number"]');
    const minInput = numberInputs[0] as HTMLInputElement;
    const maxInput = numberInputs[1] as HTMLInputElement;
    const selects = container.querySelectorAll('select');
    const categorySelect = selects[0] as HTMLSelectElement;
    const turnoSelect = selects[1] as HTMLSelectElement;

    fireEvent.change(nameInput, { target: { value: 'Vôlei' } });
    fireEvent.change(dateInput, { target: { value: '2026-06-02' } });
    fireEvent.change(categorySelect, { target: { value: 'FEMININO' } });
    fireEvent.change(turnoSelect, { target: { value: '2' } });
    fireEvent.change(minInput, { target: { value: '6' } });
    fireEvent.change(maxInput, { target: { value: '6' } });

    fireEvent.click(screen.getByRole('button', { name: /Cadastrar Esporte/i }));

    await waitFor(() => {
      expect(screen.getByText('Vôlei')).toBeInTheDocument();
      expect(screen.getByText('FEMININO')).toBeInTheDocument();
      expect(screen.getAllByText(/2º Turno/i).length).toBeGreaterThan(0);
      expect(screen.getByText('6 a 6 participantes')).toBeInTheDocument();
    });
  });
});
