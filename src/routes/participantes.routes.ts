import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { requireAuth } from '../middlewares/auth';
import { validateBody } from '../middlewares/validation';
import { ParticipantSchema } from '../schemas/validation.schemas';

const router = Router();

function cleanDigits(value: string | null | undefined): string | null {
  if (!value) return null;
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 4) return value;
  return clean;
}

function getChanges(oldObj: any, newObj: any) {
  const changes: any = {};
  for (const key of Object.keys(newObj)) {
    const oldVal = oldObj[key];
    const newVal = newObj[key];
    if (oldVal !== newVal) {
      changes[key] = { old: oldVal === undefined ? null : oldVal, new: newVal === undefined ? null : newVal };
    }
  }
  return changes;
}

router.get('/', requireAuth(), async (req: any, res) => {
  try {
    const [participantes, delegacoes] = await Promise.all([
      db.getParticipantes(),
      db.getDelegacoes()
    ]);

    let result = participantes;
    if (req.user.role === 'MODERADOR') {
      result = result.filter((p: any) => p.delegacaoId === req.user.delegacaoId);
    }
    const populated = result.map((p: any) => ({
      ...p,
      delegacaoNome: delegacoes.find((d: any) => d.id === p.delegacaoId)?.nome || ''
    }));
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.post('/', requireAuth(), validateBody(ParticipantSchema), async (req: any, res) => {
  try {
    const p = req.body;
    if (p.cpf) p.cpf = cleanDigits(p.cpf);
    if (p.celular) p.celular = cleanDigits(p.celular);

    if (req.user.role === 'MODERADOR' && p.delegacaoId !== req.user.delegacaoId) {
      return res.status(403).json({ error: 'Só pode cadastrar da própria delegação' });
    }

    // Check if participant with this CPF already exists
    const existingPart = await db.getParticipanteByCpf(p.cpf);
    if (existingPart) {
      return res.status(400).json({ error: 'CPF já cadastrado para outro participante' });
    }

    p.id = uuidv4();
    await db.createParticipante(p);

    if (p.tipo === 'MODERADOR' || p.tipo === 'ADMIN_GERAL' || p.tipo === 'MANAGER') {
      await db.createUser({
        id: uuidv4(),
        nome: p.nomeCompleto,
        cpf: p.cpf,
        password: p.cpf,
        role: p.tipo,
        delegacaoId: p.delegacaoId
      });
    }

    res.json(p);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.put('/:id', requireAuth(['ADMIN_GERAL', 'MANAGER', 'MODERADOR']), validateBody(ParticipantSchema), async (req: any, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    if (body.cpf) body.cpf = cleanDigits(body.cpf);
    if (body.celular) body.celular = cleanDigits(body.celular);

    const old = await db.getParticipanteById(id);
    if (!old) return res.status(404).json({ error: 'Participante não encontrado' });

    // Validate own delegation access for moderators
    if (req.user.role === 'MODERADOR') {
      if (old.delegacaoId !== req.user.delegacaoId) {
        return res.status(403).json({ error: 'Não é possível alterar participantes de outra delegação' });
      }
      if (body.delegacaoId && body.delegacaoId !== req.user.delegacaoId) {
        return res.status(403).json({ error: 'Não é possível mover participante para outra delegação' });
      }
    }

    // Check if another participant with this CPF already exists
    if (body.cpf && body.cpf !== old.cpf) {
      const existingPart = await db.getParticipanteByCpf(body.cpf);
      if (existingPart && existingPart.id !== id) {
        return res.status(400).json({ error: 'CPF já cadastrado para outro participante' });
      }
    }

    const updated = {
      nomeCompleto: body.nomeCompleto ?? old.nomeCompleto,
      nomeAbreviado: body.nomeAbreviado ?? old.nomeAbreviado,
      cpf: body.cpf ?? old.cpf,
      dataNascimento: body.dataNascimento ?? old.dataNascimento,
      idade: body.idade !== undefined && body.idade !== null ? Number(body.idade) : old.idade,
      sexo: body.sexo ?? old.sexo,
      celular: body.celular ?? old.celular,
      tipo: body.tipo ?? old.tipo,
      delegacaoId: body.delegacaoId !== undefined ? (body.delegacaoId === '' ? null : body.delegacaoId) : old.delegacaoId
    };

    const changes = getChanges(old, updated);
    if (Object.keys(changes).length > 0) {
      await db.updateParticipante(id, updated);
      await db.logUpdate('participante', id, req.user.id, changes);
    }

    res.json({ id, ...updated });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.delete('/:id', requireAuth(['ADMIN_GERAL', 'MANAGER']), async (req: any, res) => {
  try {
    const { id } = req.params;
    const old = await db.getParticipanteById(id);
    if (!old) return res.status(404).json({ error: 'Participante não encontrado' });

    await db.deleteParticipante(id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

export default router;
