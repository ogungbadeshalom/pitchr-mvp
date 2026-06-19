CREATE TABLE IF NOT EXISTS referral_links (
  code TEXT PRIMARY KEY,
  marketer_name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'affiliate',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by TEXT REFERENCES referral_links(code);
