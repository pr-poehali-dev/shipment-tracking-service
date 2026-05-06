INSERT INTO t_p68201465_shipment_tracking_se.users (username, password_hash, full_name, role, phone)
VALUES (
  'admin',
  '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
  'Администратор',
  'admin',
  '+7 (900) 000-00-00'
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

INSERT INTO t_p68201465_shipment_tracking_se.shipments (shipment_number, destination, driver, weight, comment, created_by)
VALUES
  ('А-0001', 'Москва, ул. Ленина 42', 'Петров И.В.', '1.4 т', NULL, 1),
  ('А-0002', 'Санкт-Петербург, пр. Невский 15', 'Сидоров М.А.', '0.8 т', NULL, 1),
  ('А-0003', 'Казань, ул. Баумана 7', 'Козлов Д.С.', '2.1 т', NULL, 1)
ON CONFLICT (shipment_number) DO NOTHING;

INSERT INTO t_p68201465_shipment_tracking_se.notifications (user_id, text, type, read)
VALUES
  (1, 'Добро пожаловать в ОтгрузкиПро!', 'info', false),
  (1, 'Система успешно запущена', 'success', false);
