-- Setup database tables for procurement app
-- This script creates all necessary tables for the microservice architecture

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password TEXT NOT NULL,
  company TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  supplier TEXT NOT NULL,
  order_no TEXT NOT NULL,
  ref_no TEXT NOT NULL,
  due_date TEXT NOT NULL,
  branch TEXT NOT NULL,
  requisition_type TEXT NOT NULL,
  item_ledger_group TEXT NOT NULL,
  item TEXT NOT NULL,
  min_qty DECIMAL NOT NULL,
  max_qty DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  rate DECIMAL NOT NULL,
  delivery_date TEXT NOT NULL,
  cgst DECIMAL NOT NULL,
  sgst DECIMAL NOT NULL,
  igst DECIMAL NOT NULL,
  vat DECIMAL NOT NULL,
  last_approved_rate DECIMAL NOT NULL,
  last_supplier TEXT NOT NULL,
  broker TEXT NOT NULL,
  total_amount DECIMAL NOT NULL,
  status TEXT NOT NULL,
  delivery_type TEXT NOT NULL,
  open_po TEXT NOT NULL,
  open_po_no TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_approved BOOLEAN DEFAULT FALSE,
  approval_notes TEXT
);

-- Chat Sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  count INTEGER,
  severity TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tutorials table
CREATE TABLE IF NOT EXISTS tutorials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tutorial_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT TRUE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, tutorial_id)
);

-- Themes table
CREATE TABLE IF NOT EXISTS themes (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme_name TEXT DEFAULT 'cyberpunk',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_branch ON purchase_orders(branch);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
