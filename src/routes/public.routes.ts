import { Router } from 'express';
import { db } from '../db';

const router = Router();

router.get('/partidas', async (req, res) => {
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
        equipe1DelegacaoId: e1?.delegacaoId,
        equipe2DelegacaoId: e2?.delegacaoId,
        esporteNome: esp?.nome || 'Desconhecido',
        equipeVencedoraNome: v?.nome || undefined
      };
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.get('/esportes', async (req, res) => {
  try {
    const esportes = await db.getEsportes();
    res.json(esportes);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.get('/ranking', async (req, res) => {
  try {
    const [delegacoes, partidas, equipes] = await Promise.all([
      db.getDelegacoes(),
      db.getPartidas(),
      db.getEquipes()
    ]);

    const rankingMap: any = {};
    delegacoes.forEach((d: any) => {
      rankingMap[d.id] = { delegacaoId: d.id, delegacaoNome: d.nome, ouro: 0, prata: 0, bronze: 0, total: 0 };
    });

    partidas.forEach((p: any) => {
      if (p.medalhaEquipe1 && p.equipe1Id) {
        const e1 = equipes.find((e: any) => e.id === p.equipe1Id);
        if (e1 && rankingMap[e1.delegacaoId]) {
          if (p.medalhaEquipe1 === 'OURO') rankingMap[e1.delegacaoId].ouro++;
          else if (p.medalhaEquipe1 === 'PRATA') rankingMap[e1.delegacaoId].prata++;
          else if (p.medalhaEquipe1 === 'BRONZE') rankingMap[e1.delegacaoId].bronze++;
          rankingMap[e1.delegacaoId].total++;
        }
      }
      if (p.medalhaEquipe2 && p.equipe2Id) {
        const e2 = equipes.find((e: any) => e.id === p.equipe2Id);
        if (e2 && rankingMap[e2.delegacaoId]) {
          if (p.medalhaEquipe2 === 'OURO') rankingMap[e2.delegacaoId].ouro++;
          else if (p.medalhaEquipe2 === 'PRATA') rankingMap[e2.delegacaoId].prata++;
          else if (p.medalhaEquipe2 === 'BRONZE') rankingMap[e2.delegacaoId].bronze++;
          rankingMap[e2.delegacaoId].total++;
        }
      }
    });

    const ranking = Object.values(rankingMap).sort((a: any, b: any) => {
      if (b.ouro !== a.ouro) return b.ouro - a.ouro;
      if (b.prata !== a.prata) return b.prata - a.prata;
      if (b.bronze !== a.bronze) return b.bronze - a.bronze;
      return b.total - a.total;
    });

    res.json(ranking);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

export default router;
