import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { requireAuth } from '../middlewares/auth';
import { validateBody } from '../middlewares/validation';
import { DelegacaoSchema } from '../schemas/validation.schemas';

const router = Router();

router.get('/', requireAuth(), async (req: any, res) => {
  try {
    const delegacoes = await db.getDelegacoes();
    if (['ADMIN_GERAL', 'MANAGER'].includes(req.user.role)) {
      res.json(delegacoes);
    } else if (req.user.role === 'MODERADOR') {
      const del = delegacoes.find((d: any) => d.id === req.user.delegacaoId);
      res.json(del ? [del] : []);
    } else {
      res.json([]);
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.post('/', requireAuth(['ADMIN_GERAL', 'MANAGER']), validateBody(DelegacaoSchema), async (req: any, res) => {
  try {
    const { nome } = req.body;
    const newDel = { id: uuidv4(), nome };
    await db.createDelegacao(newDel);
    res.json(newDel);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.put('/:id', requireAuth(['ADMIN_GERAL', 'MANAGER']), validateBody(DelegacaoSchema), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { nome } = req.body;
    const old = await db.getDelegacaoById(id);
    if (!old) return res.status(404).json({ error: 'Delegação não encontrada' });

    const changes = { nome: { old: old.nome, new: nome } };
    await db.updateDelegacao(id, { nome });
    await db.logUpdate('delegacao', id, req.user.id, changes);

    res.json({ id, nome });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.delete('/:id', requireAuth(['ADMIN_GERAL', 'MANAGER']), async (req: any, res) => {
  try {
    const { id } = req.params;
    const old = await db.getDelegacaoById(id);
    if (!old) return res.status(404).json({ error: 'Delegação não encontrada' });

    await db.deleteDelegacao(id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

export default router;
