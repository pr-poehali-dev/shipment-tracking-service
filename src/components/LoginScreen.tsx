import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import type { User } from '@/components/types';

export default function LoginScreen({ onLogin }: { onLogin: (user: User) => void }) {
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
