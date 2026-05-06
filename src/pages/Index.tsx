import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';

type Page = 'home' | 'shipments' | 'reports' | 'profile';

interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
  phone: string;
}

interface Shipment {
  id: number;
  shipment_number: string;
  destination: string;
  driver: string;
  weight: string;
  comment: string;
  created_at: string;
  status: string;
}

interface Notification {
  id: number;
  text: string;
  type: string;
  read: boolean;
  created_at: string;
}

interface ReportData {
  monthly: { month: string; count: number }[];
  total: number;
  this_month: number;
  today: number;
  top_drivers: { driver: string; count: number }[];
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(username.trim(), password);
      localStorage.setItem('auth_token', data.token);
      onLogin(data.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 font-golos">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center glow-amber mb-4">
            <Icon name="Zap" size={30} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">ОтгрузкиПро</h1>
          <p className="text-muted-foreground text-sm mt-1">Система управления отгрузками</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Логин</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="User" size={16} />
              </div>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Пароль</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Lock" size={16} />
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-secondary border border-border rounded-xl pl-10 pr-12 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name={showPass ? 'EyeOff' : 'Eye'} size={16} />
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <Icon name="AlertCircle" size={15} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all glow-amber disabled:opacity-60 mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Icon name="Loader" size={16} className="animate-spin" />
                Вход...
              </span>
            ) : 'Войти'}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Доступ только для авторизованных сотрудников
        </p>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
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

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ user, shipments, onNavigate, onAdd }: { user: User; shipments: Shipment[]; onNavigate: (p: Page) => void; onAdd: () => void }) {
  const today = shipments.filter(s => {
    const d = new Date(s.created_at);
    return d.toDateString() === new Date().toDateString();
  }).length;

  return (
    <div className="px-4 py-5 space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-black text-foreground">Привет, {user.full_name.split(' ')[0]} 👋</h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card-glass rounded-2xl p-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
            <Icon name="Package" size={18} className="text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">{shipments.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Всего отгрузок</div>
        </div>
        <div className="card-glass rounded-2xl p-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
            <Icon name="CheckCircle" size={18} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-foreground">{today}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Сегодня</div>
        </div>
      </div>

      <button
        onClick={onAdd}
        className="w-full flex items-center justify-between px-5 py-4 bg-primary text-primary-foreground rounded-2xl glow-amber active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Icon name="Plus" size={20} />
          </div>
          <div className="text-left">
            <div className="font-bold text-base">Новая отгрузка</div>
            <div className="text-xs opacity-80">Добавить запись</div>
          </div>
        </div>
        <Icon name="ArrowRight" size={20} />
      </button>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-foreground">Последние отгрузки</h3>
          <button onClick={() => onNavigate('shipments')} className="text-xs text-primary flex items-center gap-1">
            Все <Icon name="ArrowRight" size={13} />
          </button>
        </div>
        {shipments.length === 0 ? (
          <div className="card-glass rounded-2xl p-8 flex flex-col items-center text-center">
            <Icon name="PackageOpen" size={36} className="text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Отгрузок пока нет</p>
            <button onClick={onAdd} className="mt-3 text-sm text-primary font-medium">Добавить первую</button>
          </div>
        ) : (
          <div className="space-y-2">
            {shipments.slice(0, 5).map(s => <ShipmentCard key={s.id} shipment={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SHIPMENTS PAGE ──────────────────────────────────────────────────────────
function ShipmentsPage({ shipments, onAdd, onEdit, onReload }: { shipments: Shipment[]; onAdd: () => void; onEdit: (s: Shipment) => void; onReload: () => Promise<void> }) {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const filtered = shipments.filter(s =>
    s.shipment_number.toLowerCase().includes(search.toLowerCase()) ||
    s.destination.toLowerCase().includes(search.toLowerCase()) ||
    (s.driver || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="px-4 pt-5 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-foreground">Отгрузки</h2>
            <p className="text-xs text-muted-foreground">{filtered.length} записей</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => { setLoading(true); await onReload(); setLoading(false); }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground border border-border/50 transition-all active:scale-95"
            >
              <Icon name="RefreshCw" size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold active:scale-95 transition-all"
            >
              <Icon name="Plus" size={16} />
              Добавить
            </button>
          </div>
        </div>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Icon name="Search" size={15} />
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по номеру, адресу, водителю..."
            className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="px-4 pb-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Icon name="PackageOpen" size={44} className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{search ? 'Ничего не найдено' : 'Отгрузок пока нет'}</p>
            {!search && <button onClick={onAdd} className="mt-3 text-sm text-primary font-medium">Добавить первую</button>}
          </div>
        ) : (
          filtered.map(s => <ShipmentCard key={s.id} shipment={s} onEdit={() => onEdit(s)} />)
        )}
      </div>
    </div>
  );
}

// ─── SHIPMENT CARD ────────────────────────────────────────────────────────────
function ShipmentCard({ shipment: s, onEdit }: { shipment: Shipment; onEdit?: () => void }) {
  const date = s.created_at ? new Date(s.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '';
  return (
    <div className="card-glass rounded-2xl p-4 transition-all active:scale-[0.99]" onClick={onEdit}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Icon name="Package" size={17} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-primary">#{s.shipment_number}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold">Отгружен</span>
            </div>
            <p className="text-sm text-foreground leading-snug">{s.destination}</p>
            {s.driver && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Icon name="User" size={11} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{s.driver}</span>
              </div>
            )}
            {s.weight && (
              <div className="flex items-center gap-1.5 mt-1">
                <Icon name="Weight" size={11} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{s.weight}</span>
              </div>
            )}
            {s.comment && <p className="text-xs text-muted-foreground mt-1.5 italic line-clamp-2">{s.comment}</p>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">{date}</span>
          {onEdit && (
            <button
              onClick={e => { e.stopPropagation(); onEdit(); }}
              className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95"
            >
              <Icon name="Edit2" size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── REPORTS PAGE ────────────────────────────────────────────────────────────
function ReportsPage({ reports, onReload }: { reports: ReportData | null; onReload: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);

  if (!reports) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Icon name="Loader" size={28} className="text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Загрузка отчётов...</p>
      </div>
    );
  }

  const maxCount = reports.monthly.length > 0 ? Math.max(...reports.monthly.map(m => m.count)) : 1;

  return (
    <div className="px-4 py-5 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-foreground">Отчёты</h2>
          <p className="text-xs text-muted-foreground">Аналитика по отгрузкам</p>
        </div>
        <button
          onClick={async () => { setLoading(true); await onReload(); setLoading(false); }}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground border border-border/50 transition-all active:scale-95"
        >
          <Icon name="RefreshCw" size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Всего', value: reports.total, icon: 'Package', color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'В этом мес.', value: reports.this_month, icon: 'CalendarDays', color: 'text-sky-400', bg: 'bg-sky-500/10' },
          { label: 'Сегодня', value: reports.today, icon: 'Zap', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map((s, i) => (
          <div key={i} className="card-glass rounded-2xl p-3 text-center">
            <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center mx-auto mb-2`}>
              <Icon name={s.icon} size={15} className={s.color} />
            </div>
            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card-glass rounded-2xl p-4">
        <h3 className="font-bold text-foreground mb-4 text-sm">Отгрузки по месяцам</h3>
        {reports.monthly.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Icon name="BarChart3" size={32} className="text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Данных пока нет</p>
          </div>
        ) : (
          <div className="flex items-end gap-2 h-32">
            {reports.monthly.map((d, i) => {
              const height = maxCount > 0 ? Math.round((d.count / maxCount) * 100) : 4;
              const isLast = i === reports.monthly.length - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[9px] font-bold text-foreground">{d.count}</span>
                  <div
                    className="w-full rounded-t-lg overflow-hidden transition-all duration-700"
                    style={{
                      height: `${Math.max(height, 4)}%`,
                      background: isLast
                        ? 'linear-gradient(180deg, hsl(35,100%,60%) 0%, hsl(25,100%,45%) 100%)'
                        : 'linear-gradient(180deg, rgba(255,160,30,0.45) 0%, rgba(255,100,30,0.2) 100%)',
                      boxShadow: isLast ? '0 0 16px rgba(255,160,30,0.35)' : 'none',
                    }}
                  />
                  <span className="text-[9px] text-muted-foreground">{d.month}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {reports.top_drivers.length > 0 && (
        <div className="card-glass rounded-2xl p-4">
          <h3 className="font-bold text-foreground mb-4 text-sm">Топ водителей</h3>
          <div className="space-y-3">
            {reports.top_drivers.map((d, i) => {
              const maxCnt = reports.top_drivers[0].count;
              const pct = Math.round((d.count / maxCnt) * 100);
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-muted-foreground text-center">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-foreground truncate">{d.driver}</span>
                      <span className="text-xs text-muted-foreground ml-2 shrink-0">{d.count} отгр.</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: i === 0
                            ? 'linear-gradient(90deg, hsl(35,100%,55%), hsl(25,100%,50%))'
                            : 'linear-gradient(90deg, rgba(255,160,30,0.5), rgba(255,100,30,0.3))'
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────
function ProfilePage({ user, onLogout, onReload }: { user: User; onLogout: () => void; onReload: () => void }) {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user.full_name);
  const [phone, setPhone] = useState(user.phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const payload: { full_name?: string; phone?: string; password?: string } = {};
      if (fullName.trim()) payload.full_name = fullName.trim();
      if (phone.trim()) payload.phone = phone.trim();
      if (newPassword.trim()) payload.password = newPassword.trim();
      await api.updateProfile(payload);
      setSuccess('Профиль обновлён');
      setEditing(false);
      setNewPassword('');
      onReload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-5 space-y-5 animate-fade-in">
      <h2 className="text-xl font-black text-foreground">Профиль</h2>

      <div className="card-glass rounded-2xl p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xl font-black text-primary-foreground glow-amber shrink-0">
          {user.full_name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="text-base font-bold text-foreground">{user.full_name}</div>
          <div className="text-sm text-muted-foreground">@{user.username}</div>
          <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Icon name="ShieldCheck" size={11} />
            {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
          </div>
        </div>
      </div>

      <div className="card-glass rounded-2xl p-4 space-y-4">
        {editing ? (
          <>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Имя</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Телефон</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7 (___) ___-__-__"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Новый пароль (необязательно)</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Оставьте пустым, чтобы не менять"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={loading}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm active:scale-95 transition-all disabled:opacity-60">
                {loading ? 'Сохраняю...' : 'Сохранить'}
              </button>
              <button onClick={() => { setEditing(false); setFullName(user.full_name); setPhone(user.phone || ''); setNewPassword(''); }}
                className="flex-1 py-3 bg-secondary text-foreground rounded-xl font-bold text-sm active:scale-95 transition-all">
                Отмена
              </button>
            </div>
          </>
        ) : (
          <>
            {success && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                <Icon name="CheckCircle" size={15} />{success}
              </div>
            )}
            {[
              { label: 'Логин', value: user.username, icon: 'User' },
              { label: 'Полное имя', value: user.full_name, icon: 'UserCircle' },
              { label: 'Телефон', value: user.phone || '—', icon: 'Phone' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Icon name={item.icon} size={14} className="text-muted-foreground" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="text-sm font-medium text-foreground">{item.value}</div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {!editing && (
        <div className="space-y-2">
          <button onClick={() => { setEditing(true); setSuccess(''); }}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl border border-primary/30 text-primary active:scale-[0.98] transition-all text-sm font-bold">
            <Icon name="Edit" size={16} />Редактировать профиль
          </button>
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl border border-red-500/20 text-red-400 active:scale-[0.98] transition-all text-sm font-bold">
            <Icon name="LogOut" size={16} />Выйти из аккаунта
          </button>
        </div>
      )}
    </div>
  );
}

// ─── NOTIFICATIONS PANEL ──────────────────────────────────────────────────────
function NotificationsPanel({ notifications, onClose, onMarkAll, onMarkOne }: {
  notifications: Notification[];
  onClose: () => void;
  onMarkAll: () => Promise<void>;
  onMarkOne: (id: number) => Promise<void>;
}) {
  const unread = notifications.filter(n => !n.read).length;

  const formatTime = (iso: string) => {
    if (!iso) return '';
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return 'только что';
    if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
    return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" onClick={onClose}>
      <div
        className="absolute inset-x-0 bottom-0 top-[60px] card-glass rounded-t-3xl shadow-2xl border border-border flex flex-col animate-slide-up max-w-md mx-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">Уведомления</span>
            {unread > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{unread}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {unread > 0 && (
              <button onClick={onMarkAll} className="text-xs text-primary font-medium active:opacity-70">Прочитать все</button>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <Icon name="X" size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center px-4">
              <Icon name="BellOff" size={40} className="text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">Уведомлений нет</p>
            </div>
          ) : (
            notifications.map(n => (
              <button key={n.id} onClick={() => !n.read && onMarkOne(n.id)}
                className={`w-full flex gap-3 px-5 py-4 text-left border-b border-border/30 last:border-0 transition-colors active:bg-white/[0.02] ${!n.read ? 'bg-primary/5' : ''}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${n.type === 'success' ? 'bg-emerald-500/10' : n.type === 'warning' ? 'bg-amber-500/10' : 'bg-sky-500/10'}`}>
                  <Icon name={n.type === 'success' ? 'CheckCircle' : n.type === 'warning' ? 'AlertCircle' : 'Info'} size={16}
                    className={n.type === 'success' ? 'text-emerald-400' : n.type === 'warning' ? 'text-amber-400' : 'text-sky-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">{n.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatTime(n.created_at)}</p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0 pulse-glow" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── BOTTOM MODAL ─────────────────────────────────────────────────────────────
function BottomModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="w-full max-w-md mx-auto card-glass rounded-t-3xl border border-border shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
          <h3 className="font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>
        <div className="px-5 py-4 pb-8">{children}</div>
      </div>
    </div>
  );
}

// ─── ADD SHIPMENT MODAL ───────────────────────────────────────────────────────
function AddShipmentModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (data: { destination: string; driver?: string; weight?: string; comment?: string }) => Promise<void>;
}) {
  const [destination, setDestination] = useState('');
  const [driver, setDriver] = useState('');
  const [weight, setWeight] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) { setError('Укажите пункт назначения'); return; }
    setLoading(true); setError('');
    try {
      await onSave({ destination: destination.trim(), driver: driver.trim() || undefined, weight: weight.trim() || undefined, comment: comment.trim() || undefined });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка');
      setLoading(false);
    }
  };

  return (
    <BottomModal title="Новая отгрузка" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Пункт назначения *</label>
          <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Город, улица, дом" autoFocus
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Водитель</label>
          <input value={driver} onChange={e => setDriver(e.target.value)} placeholder="Фамилия И.О."
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Вес груза</label>
          <input value={weight} onChange={e => setWeight(e.target.value)} placeholder="Например: 1.5 т"
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Комментарий</label>
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Дополнительная информация..." rows={2}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none" />
        </div>
        {error && (
          <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <Icon name="AlertCircle" size={15} />{error}
          </div>
        )}
        <button type="submit" disabled={loading}
          className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-sm active:scale-[0.98] transition-all disabled:opacity-60 glow-amber">
          {loading ? <span className="flex items-center justify-center gap-2"><Icon name="Loader" size={15} className="animate-spin" />Создаю...</span> : 'Создать отгрузку'}
        </button>
      </form>
    </BottomModal>
  );
}

// ─── EDIT SHIPMENT MODAL ──────────────────────────────────────────────────────
function EditShipmentModal({ shipment, onClose, onSave }: {
  shipment: Shipment;
  onClose: () => void;
  onSave: (data: { destination: string; driver?: string; weight?: string; comment?: string }) => Promise<void>;
}) {
  const [destination, setDestination] = useState(shipment.destination);
  const [driver, setDriver] = useState(shipment.driver || '');
  const [weight, setWeight] = useState(shipment.weight || '');
  const [comment, setComment] = useState(shipment.comment || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) { setError('Укажите пункт назначения'); return; }
    setLoading(true); setError('');
    try {
      await onSave({ destination: destination.trim(), driver: driver.trim() || undefined, weight: weight.trim() || undefined, comment: comment.trim() || undefined });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка');
      setLoading(false);
    }
  };

  return (
    <BottomModal title={`Отгрузка #${shipment.shipment_number}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Пункт назначения *</label>
          <input value={destination} onChange={e => setDestination(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Водитель</label>
          <input value={driver} onChange={e => setDriver(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Вес груза</label>
          <input value={weight} onChange={e => setWeight(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Комментарий</label>
          <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none" />
        </div>
        {error && (
          <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <Icon name="AlertCircle" size={15} />{error}
          </div>
        )}
        <button type="submit" disabled={loading}
          className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-sm active:scale-[0.98] transition-all disabled:opacity-60 glow-amber">
          {loading ? <span className="flex items-center justify-center gap-2"><Icon name="Loader" size={15} className="animate-spin" />Сохраняю...</span> : 'Сохранить изменения'}
        </button>
      </form>
    </BottomModal>
  );
}