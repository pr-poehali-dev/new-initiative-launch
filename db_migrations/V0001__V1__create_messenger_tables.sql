
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  user_number INTEGER UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  session_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS user_number_seq START 1000;

CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  contact_user_id INTEGER NOT NULL REFERENCES users(id),
  alias VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(owner_id, contact_user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(id),
  receiver_id INTEGER NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calls (
  id SERIAL PRIMARY KEY,
  caller_id INTEGER NOT NULL REFERENCES users(id),
  callee_id INTEGER,
  invite_token VARCHAR(64) UNIQUE,
  status VARCHAR(20) DEFAULT 'pending',
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
