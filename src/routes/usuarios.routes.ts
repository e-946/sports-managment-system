import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { requireAuth } from '../middlewares/auth';
import { validateBody } from '../middlewares/validation';
import { UserSchema } from '../schemas/validation.schemas';

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
      if (key === 'password') {
        changes[key] = { old: '******', new: '******' };
      } else {
        changes[key] = { old: oldVal === undefined ? null : oldVal, new: newVal === undefined ? null : newVal };
      }
    }
  }
  return changes;
}

router.get('/', requireAuth(['ADMIN_GERAL', 'MANAGER']), async (req: any, res) => {
  try {
    const [users, delegacoes] = await Promise.all([
      db.getUsuarios(),
      db.getDelegacoes()
    ]);

    let safeUsers = users.map((u: any) => {
      const del = delegacoes.find((d: any) => d.id === u.delegacaoId);
      return { id: u.id, nome: u.nome, cpf: u.cpf, role: u.role, delegacaoNome: del ? del.nome : '-' };
    });
    if (req.user.role === 'MANAGER') {
      safeUsers = safeUsers.filter((u: any) => u.role !== 'ADMIN_GERAL');
    }
    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.post('/', requireAuth(['ADMIN_GERAL', 'MANAGER']), validateBody(UserSchema), async (req: any, res) => {
  try {
    const { nome, cpf, password, role, delegacaoId } = req.body;
    const cleanCpf = cleanDigits(cpf);
    if (req.user.role === 'MANAGER' && role !== 'MODERADOR') {
      return res.status(403).json({ error: 'Managers só podem criar contas de Moderadores' });
    }
    const existingUser = await db.getUserByCpf(cleanCpf || '');
    if (existingUser) {
      return res.status(400).json({ error: 'CPF já cadastrado' });
    }
    const newUser = { id: uuidv4(), nome, cpf: cleanCpf, password, role, delegacaoId };
    await db.createUser(newUser);
    res.json({ id: newUser.id, nome, cpf, role });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.put('/:id', requireAuth(['ADMIN_GERAL']), validateBody(UserSchema), async (req: any, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const old = await db.getUserById(id);
    if (!old) return res.status(404).json({ error: 'Usuário não encontrado' });

    const updated = {
      nome: body.nome ?? old.nome,
      role: body.role ?? old.role,
      delegacaoId: body.delegacaoId !== undefined ? (body.delegacaoId === '' ? null : body.delegacaoId) : old.delegacaoId,
      password: body.password || undefined
    };

    const changes = getChanges(old, updated);
    if (Object.keys(changes).length > 0) {
      await db.updateUser(id, updated);
      await db.logUpdate('user', id, req.user.id, changes);
    }

    res.json({ id, nome: updated.nome, role: updated.role });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.delete('/:id', requireAuth(['ADMIN_GERAL']), async (req: any, res) => {
  try {
    const targetUserId = req.params.id;
    const targetUser = await db.getUserById(targetUserId);
    
    if (!targetUser) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (targetUser.id === req.user.id) return res.status(400).json({ error: 'Não é possível excluir a própria conta aqui' });
    
    if (targetUser.role === 'ADMIN_GERAL') {
      return res.status(403).json({ error: 'Não é possível excluir outro ADMIN_GERAL' });
    }

    await db.deleteUser(targetUserId, req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

export default router;
