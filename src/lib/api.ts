const URLS = {
  auth: 'https://functions.poehali.dev/a897c361-187d-4f60-bb12-619f6218b489',
  shipments: 'https://functions.poehali.dev/9189e154-df20-423b-916d-43380ff2be65',
  notifications: 'https://functions.poehali.dev/d6d2de10-c6e2-412e-a9d7-3b1dabdc0a52',
  reports: 'https://functions.poehali.dev/2608e48e-b55c-4642-9509-fc3c7019224e',
};

function getToken(): string {
  return localStorage.getItem('auth_token') || '';
}

async function req(base: string, path: string, method = 'GET', body?: object) {
  const token = getToken();
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-Auth-Token': token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    req(URLS.auth, '/login', 'POST', { username, password }),
  logout: () => req(URLS.auth, '/logout', 'POST'),
  me: () => req(URLS.auth, '/me'),
  updateProfile: (data: { full_name?: string; phone?: string; password?: string }) =>
    req(URLS.auth, '/profile', 'PUT', data),

  // Shipments
  getShipments: () => req(URLS.shipments, '/'),
  createShipment: (data: { destination: string; driver?: string; weight?: string; comment?: string }) =>
    req(URLS.shipments, '/', 'POST', data),
  updateShipment: (id: number, data: { destination?: string; driver?: string; weight?: string; comment?: string }) =>
    req(URLS.shipments, `/${id}`, 'PUT', data),

  // Notifications
  getNotifications: () => req(URLS.notifications, '/'),
  markAllRead: () => req(URLS.notifications, '/read-all', 'PUT'),
  markRead: (id: number) => req(URLS.notifications, `/${id}/read`, 'PUT'),

  // Reports
  getReports: () => req(URLS.reports, '/'),
};
