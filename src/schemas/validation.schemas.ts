import { z } from 'zod';

export const LoginSchema = z.object({
  cpf: z.string().min(1, 'CPF é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória')
});

export const DelegacaoSchema = z.object({
  nome: z.string().min(1, 'Nome da delegação deve ser preenchido')
});

export const UserSchema = z.object({
  nome: z.string().optional().nullable(),
  cpf: z.string().min(1, 'CPF é obrigatório'),
  password: z.string().optional().nullable(),
  role: z.enum(['ADMIN_GERAL', 'MANAGER', 'MODERADOR', 'PARTICIPANTE']).optional().nullable(),
  delegacaoId: z.string().optional().nullable().or(z.literal(''))
});

export const SportSchema = z.object({
  nome: z.string().optional().nullable(),
  categoria: z.enum(['MASCULINO', 'FEMININO', 'MISTO']).optional().nullable(),
  turno: z.coerce.number().int().min(1).max(3).optional().nullable(),
  data: z.string().optional().nullable(),
  minParticipantes: z.coerce.number().int().optional().nullable(),
  maxParticipantes: z.coerce.number().int().optional().nullable()
}).refine(data => {
  if (data.maxParticipantes === undefined || data.maxParticipantes === null || 
      data.minParticipantes === undefined || data.minParticipantes === null) {
    return true;
  }
  return data.maxParticipantes >= data.minParticipantes;
}, {
  message: 'Quantidade máxima deve ser maior ou igual à quantidade mínima',
  path: ['maxParticipantes']
});

export const ParticipantSchema = z.object({
  nomeCompleto: z.string().optional().nullable(),
  nomeAbreviado: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
  dataNascimento: z.string().optional().nullable(),
  idade: z.coerce.number().int().optional().nullable(),
  sexo: z.enum(['MASCULINO', 'FEMININO']).optional().nullable(),
  celular: z.string().optional().nullable(),
  tipo: z.enum(['ATLETA', 'COMISSAO_TECNICA', 'MODERADOR', 'ADMIN_GERAL', 'MANAGER', 'PARTICIPANTE']).optional().nullable(),
  delegacaoId: z.string().optional().nullable()
});

export const TeamSchema = z.object({
  nome: z.string().optional().nullable(),
  delegacaoId: z.string().optional().nullable(),
  esporteId: z.string().optional().nullable(),
  participanteIds: z.array(z.string()).optional().nullable()
});

export const MatchSchema = z.object({
  esporteId: z.string().optional().nullable(),
  equipe1Id: z.string().optional().nullable(),
  equipe2Id: z.string().optional().nullable(),
  placar1: z.coerce.number().int().nonnegative().optional().nullable(),
  placar2: z.coerce.number().int().nonnegative().optional().nullable(),
  equipeVencedoraId: z.string().optional().nullable(),
  fase: z.string().optional().nullable(),
  medalhaEquipe1: z.enum(['OURO', 'PRATA', 'BRONZE']).optional().nullable().or(z.literal('')),
  medalhaEquipe2: z.enum(['OURO', 'PRATA', 'BRONZE']).optional().nullable().or(z.literal(''))
});
