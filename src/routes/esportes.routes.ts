import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { requireAuth } from '../middlewares/auth';
import { validateBody } from '../middlewares/validation';
import { SportSchema } from '../schemas/validation.schemas';

const router = Router();

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
    const esportes = await db.getEsportes();
    res.json(esportes);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.post('/', requireAuth(['ADMIN_GERAL', 'MANAGER']), validateBody(SportSchema), async (req: any, res) => {
  try {
    const { nome, categoria, turno, data, minParticipantes, maxParticipantes } = req.body;
    if (!data) {
      return res.status(400).json({ error: 'O esporte deve ter uma data.' });
    }
    const newEsp = {
      id: uuidv4(),
      nome,
      categoria,
      turno: Number(turno),
      data,
      minParticipantes: Number(minParticipantes),
      maxParticipantes: Number(maxParticipantes)
    };
    await db.createEsporte(newEsp);
    res.json(newEsp);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.put('/:id', requireAuth(['ADMIN_GERAL', 'MANAGER']), validateBody(SportSchema), async (req: any, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const old = await db.getEsporteById(id);
    if (!old) return res.status(404).json({ error: 'Esporte não encontrado' });

    const updated = {
      nome: body.nome ?? old.nome,
      categoria: body.categoria ?? old.categoria,
      turno: body.turno !== undefined && body.turno !== null ? Number(body.turno) : old.turno,
      data: body.data ?? old.data,
      minParticipantes: body.minParticipantes !== undefined && body.minParticipantes !== null ? Number(body.minParticipantes) : old.minParticipantes,
      maxParticipantes: body.maxParticipantes !== undefined && body.maxParticipantes !== null ? Number(body.maxParticipantes) : old.maxParticipantes
    };

    if (updated.maxParticipantes < updated.minParticipantes) {
      return res.status(400).json({ error: 'Quantidade máxima deve ser maior ou igual à quantidade mínima' });
    }

    const changes = getChanges(old, updated);
    if (Object.keys(changes).length > 0) {
      await db.updateEsporte(id, updated);
      await db.logUpdate('esporte', id, req.user.id, changes);
    }

    res.json({ id, ...updated });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.delete('/:id', requireAuth(['ADMIN_GERAL', 'MANAGER']), async (req: any, res) => {
  try {
    const { id } = req.params;
    const old = await db.getEsporteById(id);
    if (!old) return res.status(404).json({ error: 'Esporte não encontrado' });

    await db.deleteEsporte(id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

export default router;
