import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, JWT_SECRET } from '../db';
import { requireAuth } from '../middlewares/auth';
import { validateBody } from '../middlewares/validation';
import { LoginSchema } from '../schemas/validation.schemas';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  skip: () => process.env.NODE_ENV === 'test' || process.env.JWT_SECRET === 'super-secret-jwt-key',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, validateBody(LoginSchema), async (req, res) => {
  try {
    const { cpf, password } = req.body;
    const user = await db.getUserByCpf(cpf);
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    if (user.role === 'PARTICIPANTE') {
      return res.status(403).json({ error: 'Acesso apenas para Administradores' });
    }
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET!, { expiresIn: '1d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && req.protocol === 'https',
      sameSite: 'lax'
    });
    res.json({ id: user.id, nome: user.nome, cpf: user.cpf, role: user.role, delegacaoId: user.delegacaoId });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && req.protocol === 'https',
    sameSite: 'lax'
  });
  res.json({ success: true });
});

router.get('/me', requireAuth(), (req: any, res) => {
  res.json({ id: req.user.id, nome: req.user.nome, cpf: req.user.cpf, role: req.user.role, delegacaoId: req.user.delegacaoId });
});

router.put('/me/password', requireAuth(), async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 4 caracteres' });
    }
    const user = await db.getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Senha atual incorreta' });
    }
    await db.updateUserPassword(req.user.id, newPassword);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

export default router;
