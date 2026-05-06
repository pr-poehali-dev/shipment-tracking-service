export type Page = 'home' | 'shipments' | 'reports' | 'profile';

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
  phone: string;
}

export interface Shipment {
  id: number;
  shipment_number: string;
  destination: string;
  driver: string;
  weight: string;
  comment: string;
  created_at: string;
  status: string;
}

export interface Notification {
  id: number;
  text: string;
  type: string;
  read: boolean;
  created_at: string;
}

export interface ReportData {
  monthly: { month: string; count: number }[];
  total: number;
  this_month: number;
  today: number;
  top_drivers: { driver: string; count: number }[];
}
