CREATE TABLE IF NOT EXISTS t_p68201465_shipment_tracking_se.users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p68201465_shipment_tracking_se.sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p68201465_shipment_tracking_se.users(id),
  token VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS t_p68201465_shipment_tracking_se.shipments (
  id SERIAL PRIMARY KEY,
  shipment_number VARCHAR(50) NOT NULL UNIQUE,
  destination VARCHAR(500) NOT NULL,
  driver VARCHAR(200),
  weight VARCHAR(50),
  comment TEXT,
  created_by INTEGER REFERENCES t_p68201465_shipment_tracking_se.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  shipped_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p68201465_shipment_tracking_se.notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES t_p68201465_shipment_tracking_se.users(id),
  text VARCHAR(500) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
