const URLS = {
  auth: 'https://functions.poehali.dev/a897c361-187d-4f60-bb12-619f6218b489',
  shipments: 'https://functions.poehali.dev/9189e154-df20-423b-916d-43380ff2be65',
  notifications: 'https://functions.poehali.dev/d6d2de10-c6e2-412e-a9d7-3b1dabdc0a52',
  reports: 'https://functions.poehali.dev/2608e48e-b55c-4642-9509-fc3c7019224e',
};

function getToken(): string {
  return localStorage.getItem('auth_token') || '';
}

async function req(url: string, body?: object) {
  const token = getToken();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-Auth-Token': token } : {}),
    },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    req(URLS.auth, { action: 'login', username, password }),
  logout: () => req(URLS.auth, { action: 'logout' }),
  me: () => req(URLS.auth, { action: 'me' }),
  updateProfile: (data: { full_name?: string; phone?: string; password?: string }) =>
    req(URLS.auth, { action: 'update_profile', ...data }),

  // Shipments
  getShipments: () => req(URLS.shipments, { action: 'list' }),
  createShipment: (data: { destination: string; driver?: string; weight?: string; comment?: string }) =>
    req(URLS.shipments, { action: 'create', ...data }),
  updateShipment: (id: number, data: { destination?: string; driver?: string; weight?: string; comment?: string }) =>
    req(URLS.shipments, { action: 'update', id, ...data }),

  // Notifications
  getNotifications: () => req(URLS.notifications, { action: 'list' }),
  markAllRead: () => req(URLS.notifications, { action: 'mark_all_read' }),
  markRead: (id: number) => req(URLS.notifications, { action: 'mark_read', id }),

  // Reports
  getReports: () => req(URLS.reports, {}),
};
