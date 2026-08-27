import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { signToken, requireAuth, AuthRequest } from '../auth';

export const authRouter = Router();

const AVATAR_COLORS = [
  '#6366f1', '#ec4899', '#10b981', '#f59e0b',
  '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6',
];

// Register
authRouter.post('/register', async (req, res) => {
  try {
    const { username, password, douyinName, isLingyuBaby, avatarColor: customAvatarColor, avatarUrl, avatarEmoji } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 2) {
      return res.status(400).json({ error: '用户名至少需要2个字符' });
    }
    if (!password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({ error: '密码至少需要4位字符' });
    }
    if (!douyinName || typeof douyinName !== 'string' || douyinName.trim().length === 0) {
      return res.status(400).json({ error: '请填写您的抖音名称' });
    }

    const cleanUsername = username.trim();
    const cleanDouyin = douyinName.trim();

    const existing = db.findUserByUsername(cleanUsername);
    if (existing) {
      return res.status(400).json({ error: '该用户名已被注册，请更换其他用户名' });
    }

    // Password must be hashed - never store plaintext
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = 'usr_' + Math.random().toString(36).substring(2, 11);
    const avatarColor = customAvatarColor || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const newUser = db.createUser({
      id: userId,
      username: cleanUsername,
      passwordHash,
      douyinName: cleanDouyin,
      role: cleanUsername.toLowerCase() === 'admin' ? 'admin' : 'user',
      avatarColor,
      avatarUrl: avatarUrl || undefined,
      avatarEmoji: avatarEmoji || undefined,
      isLingyuBaby: Boolean(isLingyuBaby),
      createdAt: new Date().toISOString(),
    });

    const token = signToken(newUser);
    const myNation = db.findNationByOwnerId(newUser.id);

    return res.status(201).json({
      message: '注册成功并已自动登录',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        douyinName: newUser.douyinName,
        role: newUser.role,
        avatarColor: newUser.avatarColor,
        avatarUrl: newUser.avatarUrl,
        avatarEmoji: newUser.avatarEmoji,
        isLingyuBaby: newUser.isLingyuBaby,
        createdAt: newUser.createdAt,
      },
      myNation: myNation || null,
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return res.status(500).json({ error: '注册失败，服务器内部错误' });
  }
});

// Login
authRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' });
    }

    const user = db.findUserByUsername(username.trim());
    if (!user) {
      return res.status(400).json({ error: '用户名或密码不正确' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: '用户名或密码不正确' });
    }

    const token = signToken(user);
    const myNation = db.findNationByOwnerId(user.id);

    return res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        douyinName: user.douyinName,
        role: user.role,
        avatarColor: user.avatarColor,
        isLingyuBaby: user.isLingyuBaby,
        createdAt: user.createdAt,
      },
      myNation: myNation || null,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: '登录失败，服务器内部错误' });
  }
});

// Get Current User
authRouter.get('/me', requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  const myNation = db.findNationByOwnerId(user.id);

  return res.json({
    user: {
      id: user.id,
      username: user.username,
      douyinName: user.douyinName,
      role: user.role,
      avatarColor: user.avatarColor,
      isLingyuBaby: user.isLingyuBaby,
      createdAt: user.createdAt,
    },
    myNation: myNation || null,
  });
});

// Update Profile
authRouter.post('/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { douyinName, newPassword } = req.body;

    const updates: any = {};
    if (douyinName && typeof douyinName === 'string') {
      updates.douyinName = douyinName.trim();
      // Also sync ownerDouyinName on nation if exists
      const myNation = db.findNationByOwnerId(user.id);
      if (myNation) {
        db.updateNation(myNation.id, { ownerDouyinName: douyinName.trim() });
      }
    }

    if (newPassword && typeof newPassword === 'string' && newPassword.length >= 4) {
      updates.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = db.updateUser(user.id, updates);
    if (!updatedUser) {
      return res.status(404).json({ error: '用户未找到' });
    }

    const myNation = db.findNationByOwnerId(updatedUser.id);
    return res.json({
      message: '资料更新成功',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        douyinName: updatedUser.douyinName,
        role: updatedUser.role,
        avatarColor: updatedUser.avatarColor,
        isLingyuBaby: updatedUser.isLingyuBaby,
        createdAt: updatedUser.createdAt,
      },
      myNation: myNation || null,
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return res.status(500).json({ error: '更新失败' });
  }
});

// Toggle Admin role for current user (convenience for demo/testing administrator features)
authRouter.post('/toggle-admin-role', requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  const newRole = user.role === 'admin' ? 'user' : 'admin';
  const updatedUser = db.updateUser(user.id, { role: newRole });

  return res.json({
    message: newRole === 'admin' ? '已切换至管理员模式' : '已切换为普通用户模式',
    role: newRole,
    user: {
      id: updatedUser!.id,
      username: updatedUser!.username,
      douyinName: updatedUser!.douyinName,
      role: updatedUser!.role,
      avatarColor: updatedUser!.avatarColor,
      createdAt: updatedUser!.createdAt,
    },
  });
});
