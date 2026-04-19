-- Vendor primary website + crawl status; research run stats

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS website_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS vendor_domain text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS website_last_crawled_at timestamptz,
  ADD COLUMN IF NOT EXISTS website_crawl_status text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS website_crawl_error text NOT NULL DEFAULT '';

ALTER TABLE vendor_research_runs
  ADD COLUMN IF NOT EXISTS stats jsonb NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_vendors_website_domain ON vendors (project_id, lower(vendor_domain));
