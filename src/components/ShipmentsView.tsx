import { useState } from 'react';
import Icon from '@/components/ui/icon';
import type { Shipment } from '@/components/types';

// ─── SHIPMENT CARD ────────────────────────────────────────────────────────────
export function ShipmentCard({ shipment: s, onEdit }: { shipment: Shipment; onEdit?: () => void }) {
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

// ─── SHIPMENTS PAGE ──────────────────────────────────────────────────────────
export function ShipmentsPage({ shipments, onAdd, onEdit, onReload }: { shipments: Shipment[]; onAdd: () => void; onEdit: (s: Shipment) => void; onReload: () => Promise<void> }) {
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

// ─── BOTTOM MODAL ─────────────────────────────────────────────────────────────
export function BottomModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
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
export function AddShipmentModal({ onClose, onSave }: {
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
export function EditShipmentModal({ shipment, onClose, onSave }: {
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
