import { useState } from "react";
import Icon from "@/components/ui/icon";

type Page = "home" | "shipments" | "reports" | "profile";

const notifications = [
  { id: 1, text: "Отгрузка №А-2847 отправлена", time: "2 мин назад", type: "success", read: false },
  { id: 2, text: "Задержка на складе №3", time: "18 мин назад", type: "warning", read: false },
  { id: 3, text: "Новый заказ #5512 принят", time: "1 час назад", type: "info", read: true },
  { id: 4, text: "Водитель подтвердил доставку", time: "3 часа назад", type: "success", read: true },
];

const shipments = [
  { id: "А-2847", dest: "Москва, ул. Ленина 42", status: "В пути", statusColor: "text-emerald-400", weight: "1.4 т", date: "06.05.2026", driver: "Петров И.В." },
  { id: "А-2846", dest: "Санкт-Петербург, пр. Невский 15", status: "Доставлен", statusColor: "text-sky-400", weight: "0.8 т", date: "05.05.2026", driver: "Сидоров М.А." },
  { id: "А-2845", dest: "Казань, ул. Баумана 7", status: "Задержка", statusColor: "text-amber-400", weight: "2.1 т", date: "05.05.2026", driver: "Козлов Д.С." },
  { id: "А-2844", dest: "Екатеринбург, пр. Ленина 8", status: "Доставлен", statusColor: "text-sky-400", weight: "0.5 т", date: "04.05.2026", driver: "Новиков Р.В." },
  { id: "А-2843", dest: "Новосибирск, ул. Советская 12", status: "Отменён", statusColor: "text-red-400", weight: "1.9 т", date: "03.05.2026", driver: "—" },
  { id: "А-2842", dest: "Краснодар, ул. Красная 3", status: "Доставлен", statusColor: "text-sky-400", weight: "3.2 т", date: "02.05.2026", driver: "Петров И.В." },
];

const history = [
  { id: "А-2847", action: "Отправлено со склада", time: "06.05 09:15", icon: "Truck", color: "text-amber-400" },
  { id: "А-2846", action: "Доставка завершена", time: "05.05 14:22", icon: "CheckCircle", color: "text-emerald-400" },
  { id: "А-2845", action: "Задержка на таможне", time: "05.05 11:40", icon: "AlertCircle", color: "text-orange-400" },
  { id: "А-2844", action: "Принято получателем", time: "04.05 18:30", icon: "PackageCheck", color: "text-sky-400" },
  { id: "А-2843", action: "Заказ отменён клиентом", time: "03.05 10:05", icon: "XCircle", color: "text-red-400" },
  { id: "А-2842", action: "Доставка завершена", time: "02.05 16:55", icon: "CheckCircle", color: "text-emerald-400" },
];

const stats = [
  { label: "Активных отгрузок", value: "24", icon: "Truck", delta: "+3 сегодня", positive: true },
  { label: "Доставлено в мае", value: "189", icon: "PackageCheck", delta: "+12% к апрелю", positive: true },
  { label: "Задержки", value: "3", icon: "AlertCircle", delta: "-2 за неделю", positive: true },
  { label: "Выручка (май)", value: "₽4.2М", icon: "TrendingUp", delta: "+8.4%", positive: true },
];

const reportData = [
  { month: "Янв", count: 142, revenue: 2.8 },
  { month: "Фев", count: 158, revenue: 3.1 },
  { month: "Мар", count: 175, revenue: 3.5 },
  { month: "Апр", count: 166, revenue: 3.3 },
  { month: "Май", count: 189, revenue: 4.2 },
];

export default function Index() {
  const [page, setPage] = useState<Page>("home");
  const [notifOpen, setNotifOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredShipments = filter === "all" ? shipments
    : shipments.filter(s => {
        if (filter === "active") return s.status === "В пути";
        if (filter === "done") return s.status === "Доставлен";
        if (filter === "delay") return s.status === "Задержка";
        return true;
      });

  const navItems: { id: Page; label: string; icon: string }[] = [
    { id: "home", label: "Главная", icon: "LayoutDashboard" },
    { id: "shipments", label: "Отгрузки", icon: "Truck" },
    { id: "reports", label: "Отчёты", icon: "BarChart3" },
    { id: "profile", label: "Профиль", icon: "UserCircle" },
  ];

  return (
    <div className="min-h-screen bg-background font-golos flex">

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen border-r border-border/50 px-4 py-6 gap-2 fixed left-0 top-0 bottom-0">
        <div className="flex items-center gap-3 px-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center glow-amber">
            <Icon name="Zap" size={18} className="text-primary-foreground" />
          </div>
          <div>
            <div className="font-bold text-base text-foreground leading-tight">ОтгрузкиПро</div>
            <div className="text-xs text-muted-foreground">v1.0</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                page === item.id
                  ? "nav-active"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <button
          onClick={() => setHistoryOpen(true)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium border border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
        >
          <Icon name="History" size={18} />
          История
        </button>

        <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-3 px-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-primary-foreground">
            АН
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate text-foreground">Алексей Н.</div>
            <div className="text-xs text-muted-foreground">Менеджер</div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">

        {/* Header */}
        <header className="flex items-center justify-between px-4 lg:px-8 py-4 border-b border-border/50 sticky top-0 z-30 bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Icon name="Zap" size={15} className="text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">ОтгрузкиПро</span>
          </div>

          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-foreground">
              {navItems.find(n => n.id === page)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setHistoryOpen(true)}
              className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent transition-all"
            >
              <Icon name="History" size={16} />
              История
            </button>

            <button
              onClick={() => setNotifOpen(true)}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent transition-all"
            >
              <Icon name="Bell" size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full pulse-glow" />
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 lg:px-8 py-6 overflow-y-auto pb-20 lg:pb-6">

          {/* HOME */}
          {page === "home" && (
            <div className="animate-fade-in space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">Добро пожаловать 👋</h2>
                <p className="text-muted-foreground text-sm">Сегодня, 6 мая 2026 — всё под контролем</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                  <div key={i} className="card-glass rounded-2xl p-4 hover-scale">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon name={s.icon} size={18} className="text-primary" />
                      </div>
                      <span className="text-xs text-emerald-400 font-medium">{s.delta}</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-0.5">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent shipments */}
              <div className="card-glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Последние отгрузки</h3>
                  <button
                    onClick={() => setPage("shipments")}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    Все <Icon name="ArrowRight" size={13} />
                  </button>
                </div>
                <div className="space-y-3">
                  {shipments.slice(0, 4).map(s => (
                    <div key={s.id} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                      <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                        <Icon name="Package" size={15} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">#{s.id}</span>
                          <span className={`text-xs font-medium ${s.statusColor}`}>{s.status}</span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{s.dest}</div>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">{s.date}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPage("shipments")}
                  className="card-glass rounded-2xl p-4 flex items-center gap-3 hover-scale text-left border border-primary/20 hover:border-primary/40 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Icon name="Plus" size={18} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Новая отгрузка</div>
                    <div className="text-xs text-muted-foreground">Создать заявку</div>
                  </div>
                </button>
                <button
                  onClick={() => setPage("reports")}
                  className="card-glass rounded-2xl p-4 flex items-center gap-3 hover-scale text-left border border-border/50 hover:border-primary/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <Icon name="FileText" size={18} className="text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Отчёт за май</div>
                    <div className="text-xs text-muted-foreground">Скачать PDF</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* SHIPMENTS */}
          {page === "shipments" && (
            <div className="animate-fade-in space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Отгрузки</h2>
                  <p className="text-muted-foreground text-sm">{filteredShipments.length} записей</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-all glow-amber">
                  <Icon name="Plus" size={16} />
                  Добавить
                </button>
              </div>

              {/* Filters */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: "all", label: "Все" },
                  { key: "active", label: "В пути" },
                  { key: "done", label: "Доставлены" },
                  { key: "delay", label: "Задержки" },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                      filter === f.key
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="card-glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Направление</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Водитель</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Вес</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Статус</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Дата</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredShipments.map((s, i) => (
                        <tr
                          key={s.id}
                          className="border-b border-border/30 last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer"
                          style={{ animationDelay: `${i * 0.04}s` }}
                        >
                          <td className="py-3.5 px-4">
                            <span className="text-sm font-bold text-primary">#{s.id}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-sm text-foreground">{s.dest}</span>
                          </td>
                          <td className="py-3.5 px-4 hidden md:table-cell">
                            <span className="text-sm text-muted-foreground">{s.driver}</span>
                          </td>
                          <td className="py-3.5 px-4 hidden sm:table-cell">
                            <span className="text-sm text-muted-foreground">{s.weight}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-sm font-semibold ${s.statusColor}`}>{s.status}</span>
                          </td>
                          <td className="py-3.5 px-4 hidden lg:table-cell">
                            <span className="text-sm text-muted-foreground">{s.date}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* REPORTS */}
          {page === "reports" && (
            <div className="animate-fade-in space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Отчёты</h2>
                <p className="text-muted-foreground text-sm">Аналитика по отгрузкам и выручке</p>
              </div>

              {/* Monthly bars */}
              <div className="card-glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-foreground">Отгрузки по месяцам, 2026</h3>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50 transition-all">
                    <Icon name="Download" size={13} />
                    Скачать PDF
                  </button>
                </div>
                <div className="flex items-end gap-3 h-40">
                  {reportData.map((d, i) => {
                    const maxCount = Math.max(...reportData.map(r => r.count));
                    const height = Math.round((d.count / maxCount) * 100);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{d.count}</span>
                        <div
                          className="w-full rounded-t-lg transition-all duration-700 relative overflow-hidden"
                          style={{
                            height: `${height}%`,
                            background: i === reportData.length - 1
                              ? 'linear-gradient(180deg, hsl(35,100%,60%) 0%, hsl(25,100%,45%) 100%)'
                              : 'linear-gradient(180deg, rgba(255,160,30,0.4) 0%, rgba(255,100,30,0.2) 100%)',
                            boxShadow: i === reportData.length - 1 ? '0 0 20px rgba(255,160,30,0.3)' : 'none'
                          }}
                        >
                          <div className="shimmer absolute inset-0" />
                        </div>
                        <span className="text-xs text-muted-foreground">{d.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Revenue */}
              <div className="card-glass rounded-2xl p-5">
                <h3 className="font-semibold text-foreground mb-4">Выручка по месяцам (млн ₽)</h3>
                <div className="space-y-3">
                  {reportData.map((d, i) => {
                    const maxRev = Math.max(...reportData.map(r => r.revenue));
                    const pct = Math.round((d.revenue / maxRev) * 100);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-8 text-xs text-muted-foreground font-medium">{d.month}</span>
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${pct}%`,
                              background: i === reportData.length - 1
                                ? 'linear-gradient(90deg, hsl(35,100%,55%), hsl(25,100%,50%))'
                                : 'linear-gradient(90deg, rgba(255,160,30,0.5), rgba(255,100,30,0.3))'
                            }}
                          />
                        </div>
                        <span className="w-12 text-right text-sm font-semibold text-foreground">₽{d.revenue}М</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Всего за 5 мес.", value: "830", icon: "Package", sub: "отгрузок" },
                  { label: "Средний чек", value: "₽21K", icon: "Wallet", sub: "за отгрузку" },
                  { label: "Выручка 2026", value: "₽16.9М", icon: "TrendingUp", sub: "с начала года" },
                ].map((c, i) => (
                  <div key={i} className="card-glass rounded-2xl p-4 hover-scale">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon name={c.icon} size={16} className="text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground">{c.label}</span>
                    </div>
                    <div className="text-xl font-bold text-foreground">{c.value}</div>
                    <div className="text-xs text-muted-foreground">{c.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROFILE */}
          {page === "profile" && (
            <div className="animate-fade-in space-y-6 max-w-lg">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Профиль</h2>
                <p className="text-muted-foreground text-sm">Личные данные и настройки</p>
              </div>

              {/* Avatar */}
              <div className="card-glass rounded-2xl p-6 flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl font-black text-primary-foreground glow-amber shrink-0">
                  АН
                </div>
                <div>
                  <div className="text-xl font-bold text-foreground">Алексей Новиков</div>
                  <div className="text-sm text-muted-foreground">Старший менеджер по логистике</div>
                  <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    <Icon name="ShieldCheck" size={11} />
                    Премиум
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="card-glass rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold text-foreground mb-3">Контактные данные</h3>
                {[
                  { label: "Email", value: "a.novikov@company.ru", icon: "Mail" },
                  { label: "Телефон", value: "+7 (900) 123-45-67", icon: "Phone" },
                  { label: "Должность", value: "Менеджер по логистике", icon: "Briefcase" },
                  { label: "Отдел", value: "Логистика и доставка", icon: "Building2" },
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
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 transition-all text-sm font-medium">
                  <Icon name="Edit" size={16} />
                  Редактировать профиль
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all text-sm font-medium">
                  <Icon name="Settings" size={16} />
                  Настройки уведомлений
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium">
                  <Icon name="LogOut" size={16} />
                  Выйти из аккаунта
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Bottom nav (mobile) */}
        <nav className="lg:hidden flex border-t border-border/50 bg-background/95 backdrop-blur-md fixed bottom-0 left-0 right-0 z-30">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all ${
                page === item.id ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon name={item.icon} size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Notifications panel */}
      {notifOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={() => setNotifOpen(false)}>
          <div
            className="w-full max-w-sm mt-16 mr-4 card-glass rounded-2xl shadow-2xl border border-border animate-scale-in overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">Уведомления</span>
                {unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button onClick={() => setNotifOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="X" size={18} />
              </button>
            </div>
            <div className="divide-y divide-border/30">
              {notifications.map(n => (
                <div key={n.id} className={`flex gap-3 px-5 py-4 transition-colors hover:bg-white/[0.02] ${!n.read ? 'bg-primary/5' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    n.type === 'success' ? 'bg-emerald-500/10' : n.type === 'warning' ? 'bg-amber-500/10' : 'bg-sky-500/10'
                  }`}>
                    <Icon
                      name={n.type === 'success' ? 'CheckCircle' : n.type === 'warning' ? 'AlertCircle' : 'Info'}
                      size={15}
                      className={n.type === 'success' ? 'text-emerald-400' : n.type === 'warning' ? 'text-amber-400' : 'text-sky-400'}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground leading-snug">{n.text}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{n.time}</div>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0 pulse-glow" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History panel */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-start lg:justify-end" onClick={() => setHistoryOpen(false)}>
          <div
            className="w-full max-w-sm lg:mt-16 lg:mr-4 card-glass rounded-t-2xl lg:rounded-2xl shadow-2xl border border-border animate-slide-up overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <span className="font-semibold text-foreground">История событий</span>
              <button onClick={() => setHistoryOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="X" size={18} />
              </button>
            </div>
            <div className="divide-y divide-border/30 max-h-96 overflow-y-auto">
              {history.map((h, i) => (
                <div key={i} className="flex gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <Icon name={h.icon} size={15} className={h.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-primary font-semibold">#{h.id}</div>
                    <div className="text-sm text-foreground">{h.action}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{h.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
