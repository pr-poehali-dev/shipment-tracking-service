import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import { ShipmentCard } from '@/components/ShipmentsView';
import type { User, Shipment, Notification, ReportData, Page } from '@/components/types';

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
export function HomePage({ user, shipments, onNavigate, onAdd }: { user: User; shipments: Shipment[]; onNavigate: (p: Page) => void; onAdd: () => void }) {
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

// ─── REPORTS PAGE ────────────────────────────────────────────────────────────
export function ReportsPage({ reports, onReload }: { reports: ReportData | null; onReload: () => Promise<void> }) {
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
export function ProfilePage({ user, onLogout, onReload }: { user: User; onLogout: () => void; onReload: () => void }) {
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
export function NotificationsPanel({ notifications, onClose, onMarkAll, onMarkOne }: {
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
