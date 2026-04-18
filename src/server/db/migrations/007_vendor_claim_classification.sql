-- Optional classification for generic vendor-claim extraction (non-AllCare flows).
ALTER TABLE vendor_claims
  ADD COLUMN IF NOT EXISTS credibility text NOT NULL DEFAULT '';
ALTER TABLE vendor_claims
  ADD COLUMN IF NOT EXISTS confidence text NOT NULL DEFAULT '';
ALTER TABLE vendor_claims
  ADD COLUMN IF NOT EXISTS claim_category text NOT NULL DEFAULT 'other';
