export type Role = 'ADMIN_GERAL' | 'MANAGER' | 'MODERADOR' | 'PARTICIPANTE';

export interface User {
  id: string;
  cpf: string;
  role: Role;
  delegacaoId?: string;
  nome: string;
}

export interface Delegacao {
  id: string;
  nome: string;
}

export interface Esporte {
  id: string;
  nome: string;
  categoria: 'MASCULINO' | 'FEMININO' | 'MISTO';
  turno: 1 | 2 | 3 | 4;
  data: string;
  minParticipantes: number;
  maxParticipantes: number;
}

export interface Participante {
  id: string;
  nomeCompleto: string;
  nomeAbreviado: string;
  cpf: string;
  dataNascimento: string;
  idade: number;
  sexo: 'MASCULINO' | 'FEMININO';
  celular: string;
  tipo: Role;
  delegacaoId: string;
  delegacaoNome?: string;
}

export interface Equipe {
  id: string;
  nome: string;
  delegacaoId: string;
  delegacaoNome?: string;
  esporteId: string;
  esporteNome?: string;
  participanteIds: string[];
}

export interface Partida {
  id: string;
  esporteId: string;
  esporteNome?: string;
  equipe1Id: string;
  equipe1Nome?: string;
  equipe1DelegacaoId?: string;
  equipe2Id: string;
  equipe2Nome?: string;
  equipe2DelegacaoId?: string;
  placar1?: number;
  placar2?: number;
  equipeVencedoraId?: string;
  equipeVencedoraNome?: string;
  fase: string;
  medalhaEquipe1?: 'OURO' | 'PRATA' | 'BRONZE' | '';
  medalhaEquipe2?: 'OURO' | 'PRATA' | 'BRONZE' | '';
}

export interface MedalRanking {
  delegacaoId: string;
  delegacaoNome: string;
  ouro: number;
  prata: number;
  bronze: number;
  total: number;
}
