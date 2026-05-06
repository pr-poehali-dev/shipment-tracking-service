import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import LoginScreen from '@/components/LoginScreen';
import { HomePage, ReportsPage, ProfilePage, NotificationsPanel } from '@/components/PagesView';
import { ShipmentsPage, AddShipmentModal, EditShipmentModal } from '@/components/ShipmentsView';
import type { Page, User, Shipment, Notification, ReportData } from '@/components/types';

export default function Index() {
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [page, setPage] = useState<Page>('home');

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [reports, setReports] = useState<ReportData | null>(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editShipment, setEditShipment] = useState<Shipment | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) { setChecking(false); return; }
    api.me()
      .then(data => { setUser(data.user); setAuthed(true); })
      .catch(() => { localStorage.removeItem('auth_token'); })
      .finally(() => setChecking(false));
  }, []);

  const loadAll = useCallback(async () => {
    if (!authed) return;
    try {
      const [s, n] = await Promise.all([api.getShipments(), api.getNotifications()]);
      setShipments(s.shipments);
      setNotifications(n.notifications);
      setUnreadCount(n.unread_count);
    } catch (e) { console.error(e); }
  }, [authed]);

  const loadReports = useCallback(async () => {
    if (!authed) return;
    try {
      const r = await api.getReports();
      setReports(r);
    } catch (e) { console.error(e); }
  }, [authed]);

  useEffect(() => { if (authed) loadAll(); }, [authed, loadAll]);
  useEffect(() => { if (page === 'reports') loadReports(); }, [page, loadReports]);

  useEffect(() => {
    if (!authed) return;
    const t = setInterval(() => {
      api.getNotifications().then(n => {
        setNotifications(n.notifications);
        setUnreadCount(n.unread_count);
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, [authed]);

  const handleLogin = (u: User) => { setUser(u); setAuthed(true); };
  const handleLogout = async () => {
    try { await api.logout(); } catch (e) { console.error(e); }
    localStorage.removeItem('auth_token');
    setAuthed(false);
    setUser(null);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Icon name="Loader" size={22} className="text-primary animate-spin" />
          </div>
          <span className="text-muted-foreground text-sm">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (!authed) return <LoginScreen onLogin={handleLogin} />;

  const navItems: { id: Page; label: string; icon: string }[] = [
    { id: 'home', label: 'Главная', icon: 'LayoutDashboard' },
    { id: 'shipments', label: 'Отгрузки', icon: 'Truck' },
    { id: 'reports', label: 'Отчёты', icon: 'BarChart3' },
    { id: 'profile', label: 'Профиль', icon: 'UserCircle' },
  ];

  return (
    <div className="min-h-screen bg-background font-golos flex flex-col max-w-md mx-auto relative">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-border/50 sticky top-0 z-30 bg-background/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Icon name="Zap" size={14} className="text-primary-foreground" />
          </div>
          <span className="font-black text-foreground text-base tracking-tight">ОтгрузкиПро</span>
        </div>
        <button
          onClick={() => setNotifOpen(true)}
          className="relative w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all active:scale-95"
        >
          <Icon name="Bell" size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-primary rounded-full text-[9px] font-bold text-primary-foreground flex items-center justify-center px-0.5 pulse-glow">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {page === 'home' && (
          <HomePage user={user!} shipments={shipments} onNavigate={setPage} onAdd={() => setAddOpen(true)} />
        )}
        {page === 'shipments' && (
          <ShipmentsPage shipments={shipments} onAdd={() => setAddOpen(true)} onEdit={s => setEditShipment(s)} onReload={loadAll} />
        )}
        {page === 'reports' && <ReportsPage reports={reports} onReload={loadReports} />}
        {page === 'profile' && (
          <ProfilePage user={user!} onLogout={handleLogout} onReload={() => api.me().then(d => setUser(d.user)).catch(() => {})} />
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex border-t border-border/50 bg-background/95 backdrop-blur-md z-30">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-all active:scale-95 ${page === item.id ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${page === item.id ? 'bg-primary/10' : ''}`}>
              <Icon name={item.icon} size={21} />
            </div>
            <span className="text-[10px] font-semibold">{item.label}</span>
          </button>
        ))}
      </nav>

      {notifOpen && (
        <NotificationsPanel
          notifications={notifications}
          onClose={() => setNotifOpen(false)}
          onMarkAll={async () => { await api.markAllRead(); setUnreadCount(0); setNotifications(prev => prev.map(n => ({ ...n, read: true }))); }}
          onMarkOne={async (id) => { await api.markRead(id); setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)); setUnreadCount(prev => Math.max(0, prev - 1)); }}
        />
      )}

      {addOpen && (
        <AddShipmentModal
          onClose={() => setAddOpen(false)}
          onSave={async (data) => { await api.createShipment(data); setAddOpen(false); await loadAll(); }}
        />
      )}

      {editShipment && (
        <EditShipmentModal
          shipment={editShipment}
          onClose={() => setEditShipment(null)}
          onSave={async (data) => { await api.updateShipment(editShipment.id, data); setEditShipment(null); await loadAll(); }}
        />
      )}
    </div>
  );
}
