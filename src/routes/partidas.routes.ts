import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { requireAuth } from '../middlewares/auth';
import { validateBody } from '../middlewares/validation';
import { MatchSchema } from '../schemas/validation.schemas';

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
    const [partidas, equipes, esportes] = await Promise.all([
      db.getPartidas(),
      db.getEquipes(),
      db.getEsportes()
    ]);

    const items = partidas.map((p: any) => {
      const e1 = equipes.find((e: any) => e.id === p.equipe1Id);
      const e2 = equipes.find((e: any) => e.id === p.equipe2Id);
      const esp = esportes.find((es: any) => es.id === p.esporteId);
      const v = equipes.find((e: any) => e.id === p.equipeVencedoraId);
      return {
        ...p,
        equipe1Nome: e1?.nome || 'Desconhecida',
        equipe2Nome: e2?.nome || 'Desconhecida',
        esporteNome: esp?.nome || 'Desconhecido',
        equipeVencedoraNome: v?.nome || undefined
      };
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.post('/', requireAuth(['ADMIN_GERAL', 'MANAGER']), validateBody(MatchSchema), async (req: any, res) => {
  try {
    const p = req.body;
    p.id = uuidv4();
    await db.createPartida(p);
    res.json(p);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.put('/:id', requireAuth(['ADMIN_GERAL', 'MANAGER']), validateBody(MatchSchema), async (req: any, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const old = await db.getPartidaById(id);
    if (!old) return res.status(404).json({ error: 'Partida não encontrada' });

    const updated = {
      esporteId: body.esporteId ?? old.esporteId,
      equipe1Id: body.equipe1Id ?? old.equipe1Id,
      equipe2Id: body.equipe2Id ?? old.equipe2Id,
      placar1: body.placar1 !== undefined && body.placar1 !== null ? Number(body.placar1) : old.placar1,
      placar2: body.placar2 !== undefined && body.placar2 !== null ? Number(body.placar2) : old.placar2,
      equipeVencedoraId: body.equipeVencedoraId !== undefined ? (body.equipeVencedoraId === '' ? null : body.equipeVencedoraId) : old.equipeVencedoraId,
      fase: body.fase ?? old.fase,
      medalhaEquipe1: body.medalhaEquipe1 !== undefined ? (body.medalhaEquipe1 === '' ? null : body.medalhaEquipe1) : old.medalhaEquipe1,
      medalhaEquipe2: body.medalhaEquipe2 !== undefined ? (body.medalhaEquipe2 === '' ? null : body.medalhaEquipe2) : old.medalhaEquipe2
    };

    const changes = getChanges(old, updated);
    if (Object.keys(changes).length > 0) {
      await db.updatePartida(id, updated);
      await db.logUpdate('partida', id, req.user.id, changes);
    }

    res.json({ id, ...updated });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.delete('/:id', requireAuth(['ADMIN_GERAL', 'MANAGER']), async (req: any, res) => {
  try {
    const { id } = req.params;
    const old = await db.getPartidaById(id);
    if (!old) return res.status(404).json({ error: 'Partida não encontrada' });

    await db.deletePartida(id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

export default router;
