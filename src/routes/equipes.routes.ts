import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { requireAuth } from '../middlewares/auth';
import { validateBody } from '../middlewares/validation';
import { TeamSchema } from '../schemas/validation.schemas';

const router = Router();

function getChanges(oldObj: any, newObj: any) {
  const changes: any = {};
  for (const key of Object.keys(newObj)) {
    const oldVal = oldObj[key];
    const newVal = newObj[key];
    if (Array.isArray(oldVal) || Array.isArray(newVal)) {
      const a = Array.isArray(oldVal) ? [...oldVal].sort().join(',') : '';
      const b = Array.isArray(newVal) ? [...newVal].sort().join(',') : '';
      if (a !== b) {
        changes[key] = { old: oldVal, new: newVal };
      }
      continue;
    }
    if (oldVal !== newVal) {
      changes[key] = { old: oldVal === undefined ? null : oldVal, new: newVal === undefined ? null : newVal };
    }
  }
  return changes;
}

router.get('/', requireAuth(), async (req: any, res) => {
  try {
    const [equipes, delegacoes, esportes] = await Promise.all([
      db.getEquipes(),
      db.getDelegacoes(),
      db.getEsportes()
    ]);

    let result = equipes;
    if (req.user.role === 'MODERADOR') {
      result = result.filter((e: any) => e.delegacaoId === req.user.delegacaoId);
    }
    const pop = result.map((e: any) => ({
      ...e,
      delegacaoNome: delegacoes.find((d: any) => d.id === e.delegacaoId)?.nome || '',
      esporteNome: esportes.find((esp: any) => esp.id === e.esporteId)?.nome || '',
    }));
    res.json(pop);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.post('/', requireAuth(), validateBody(TeamSchema), async (req: any, res) => {
  try {
    const e = req.body;
    
    if (req.user.role === 'MODERADOR' && e.delegacaoId !== req.user.delegacaoId) {
      return res.status(403).json({ error: 'Só pode cadastrar da própria delegação' });
    }
    
    const esportes = await db.getEsportes();
    const esporte = esportes.find((es: any) => es.id === e.esporteId);
    if (!esporte) return res.status(400).json({ error: 'Esporte não encontrado' });

    if (e.participanteIds.length < esporte.minParticipantes || e.participanteIds.length > esporte.maxParticipantes) {
      return res.status(400).json({ error: `O esporte ${esporte.nome} exige entre ${esporte.minParticipantes} e ${esporte.maxParticipantes} participantes.` });
    }

    const [equipes, participantes] = await Promise.all([
      db.getEquipes(),
      db.getParticipantes()
    ]);

    for (const partId of e.participanteIds) {
      const partEquipes = equipes.filter((eq: any) => eq.participanteIds.includes(partId));
      for (const eq of partEquipes) {
        const outroEsporte = esportes.find((es: any) => es.id === eq.esporteId);
        if (outroEsporte && outroEsporte.data === esporte.data && outroEsporte.turno === esporte.turno) {
          const part = participantes.find((p: any) => p.id === partId);
          return res.status(400).json({ error: `O participante ${part?.nomeCompleto || partId} já está na equipe ${eq.nome} (${outroEsporte.nome}), que ocorre na mesma data (${esporte.data}) e turno (${esporte.turno}).` });
        }
      }
    }

    e.id = uuidv4();
    await db.createEquipe(e);
    res.json(e);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.put('/:id', requireAuth(['ADMIN_GERAL', 'MANAGER', 'MODERADOR']), validateBody(TeamSchema), async (req: any, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const old = await db.getEquipeById(id);
    if (!old) return res.status(404).json({ error: 'Equipe não encontrada' });

    // Validate own delegation access for moderators
    if (req.user.role === 'MODERADOR') {
      if (old.delegacaoId !== req.user.delegacaoId) {
        return res.status(403).json({ error: 'Não é possível alterar equipes de outra delegação' });
      }
      if (body.delegacaoId && body.delegacaoId !== req.user.delegacaoId) {
        return res.status(403).json({ error: 'Não é possível mover equipe para outra delegação' });
      }
    }

    const updated = {
      nome: body.nome ?? old.nome,
      delegacaoId: body.delegacaoId ?? old.delegacaoId,
      esporteId: body.esporteId ?? old.esporteId,
      participanteIds: body.participanteIds ?? old.participanteIds
    };

    const esportes = await db.getEsportes();
    const esporte = esportes.find((es: any) => es.id === updated.esporteId);
    if (!esporte) return res.status(400).json({ error: 'Esporte não encontrado' });

    if (updated.participanteIds.length < esporte.minParticipantes || updated.participanteIds.length > esporte.maxParticipantes) {
      return res.status(400).json({ error: `O esporte ${esporte.nome} exige entre ${esporte.minParticipantes} e ${esporte.maxParticipantes} participantes.` });
    }

    const [equipes, participantes] = await Promise.all([
      db.getEquipes(),
      db.getParticipantes()
    ]);

    for (const partId of updated.participanteIds) {
      // Exclude CURRENT team (id) from conflict check
      const partEquipes = equipes.filter((eq: any) => eq.id !== id && eq.participanteIds.includes(partId));
      for (const eq of partEquipes) {
        const outroEsporte = esportes.find((es: any) => es.id === eq.esporteId);
        if (outroEsporte && outroEsporte.data === esporte.data && outroEsporte.turno === esporte.turno) {
          const part = participantes.find((p: any) => p.id === partId);
          return res.status(400).json({ error: `O participante ${part?.nomeCompleto || partId} já está na equipe ${eq.nome} (${outroEsporte.nome}), que ocorre na mesma data (${esporte.data}) e turno (${esporte.turno}).` });
        }
      }
    }

    const changes = getChanges(old, updated);
    if (Object.keys(changes).length > 0) {
      await db.updateEquipe(id, updated);
      await db.logUpdate('equipe', id, req.user.id, changes);
    }

    res.json({ id, ...updated });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.delete('/:id', requireAuth(['ADMIN_GERAL', 'MANAGER', 'MODERADOR']), async (req: any, res) => {
  try {
    const { id } = req.params;
    const old = await db.getEquipeById(id);
    if (!old) return res.status(404).json({ error: 'Equipe não encontrada' });

    // Validate own delegation access for moderators
    if (req.user.role === 'MODERADOR' && old.delegacaoId !== req.user.delegacaoId) {
      return res.status(403).json({ error: 'Não é possível excluir equipes de outra delegação' });
    }

    await db.deleteEquipe(id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

export default router;
