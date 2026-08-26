import { Router } from 'express';
import { db } from '../db';
import { requireAuth, requireAdmin, AuthRequest } from '../auth';

export const notificationsRouter = Router();

// Get current user's notifications
notificationsRouter.get('/', requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  const notifs = db.getNotifications(user.id);
  const unreadCount = notifs.filter((n) => !n.isRead).length;

  return res.json({
    notifications: notifs,
    unreadCount,
  });
});

// Mark single notification as read
notificationsRouter.put('/:id/read', requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  const success = db.markNotificationAsRead(req.params.id, user.id);
  return res.json({ success });
});

// Mark all as read
notificationsRouter.post('/read-all', requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  const count = db.markAllNotificationsAsRead(user.id);
  return res.json({ message: `已将 ${count} 条通知标记为已读`, count });
});

// Delete a notification
notificationsRouter.delete('/:id', requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  const success = db.deleteNotification(req.params.id, user.id);
  return res.json({ success });
});

export const adminRouter = Router();

// Admin stats
adminRouter.get('/stats', requireAdmin, (req: AuthRequest, res) => {
  const users = db.getUsers();
  const nations = db.getNations();
  const requests = db.getDiplomaticRequests();
  const wars = requests.filter((r) => r.type === 'war' && r.status === 'active');
  const treaties = requests.filter((r) => r.type !== 'war' && r.status === 'accepted');

  return res.json({
    userCount: users.length,
    nationCount: nations.length,
    activeWarCount: wars.length,
    activeTreatyCount: treaties.length,
    pendingRequestsCount: requests.filter((r) => r.status === 'pending').length,
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      douyinName: u.douyinName,
      role: u.role,
      createdAt: u.createdAt,
      nation: nations.find((n) => n.ownerId === u.id)?.name || null,
    })),
  });
});
