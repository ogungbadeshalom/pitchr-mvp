ALTER TABLE referral_links ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) NOT NULL DEFAULT 5.0;

UPDATE referral_links SET commission_rate = 10.0 WHERE type = 'marketer' AND commission_rate = 5.0;
