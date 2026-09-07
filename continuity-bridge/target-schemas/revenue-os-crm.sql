-- Target schema for the "Revenue OS CRM" + "Content OPS" Airtable migration.
-- See ../../migration-cases/revenue-os-crm-airtable.md for the case this
-- backs and ../../migration-cases/revenue-os-crm-airtable-mappings.md for
-- the source-to-target field mapping this schema implements.
--
-- Primary keys are the original Airtable record IDs (e.g. "recENk96..."),
-- kept verbatim rather than replaced with generated IDs, so every row
-- stays traceable back to its Airtable source without a separate mapping
-- table. Rollup/formula fields are NOT stored as columns - they're
-- recomputed as views (bottom of this file) so they can never drift from
-- their source rows the way a stale copy could.

PRAGMA foreign_keys = ON;

-- ── Revenue OS CRM base ──────────────────────────────────────────────

CREATE TABLE contacts (
  id TEXT PRIMARY KEY,                 -- Airtable record ID
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  contact_type TEXT,                   -- Customer | Lead | Prospect | Partner
  lifecycle_stage TEXT,                -- Customer | Lead | Evangelist | SQL | MQL
  lead_source TEXT,
  owner_agent TEXT,
  notes TEXT,
  date_added TEXT
);

CREATE TABLE deals (
  id TEXT PRIMARY KEY,
  deal_name TEXT NOT NULL,
  stage TEXT,                          -- New Lead | Qualified | Proposal Sent | Negotiation | Won | ...
  amount REAL,
  probability REAL,
  expected_close TEXT,
  deal_type TEXT,
  priority TEXT,
  owner_agent TEXT,
  notes TEXT,
  created TEXT,
  contact_id TEXT REFERENCES contacts(id)
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  category TEXT,
  production_stage TEXT,               -- Sold Out | Minting | In Production | Live
  price REAL,
  tier TEXT,
  produced_by_agent TEXT,
  trend_score INTEGER,
  marketplace_url TEXT,
  download_link TEXT,
  created TEXT
);

CREATE TABLE product_tools (              -- "Tools Used" (multipleSelects)
  product_id TEXT NOT NULL REFERENCES products(id),
  tool TEXT NOT NULL,
  PRIMARY KEY (product_id, tool)
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,   -- e.g. "ORD-1001"
  order_date TEXT,
  amount REAL,
  payment_status TEXT,                 -- Paid | Pending
  fulfillment TEXT,                    -- Delivered | Awaiting
  channel TEXT,
  notes TEXT,
  customer_id TEXT REFERENCES contacts(id),
  deal_id TEXT REFERENCES deals(id)
);

CREATE TABLE order_products (          -- Orders.Product <-> Products.Orders (M:N)
  order_id TEXT NOT NULL REFERENCES orders(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  PRIMARY KEY (order_id, product_id)
);

CREATE TABLE deal_products (           -- Deals.Products <-> Products.Deals (M:N)
  deal_id TEXT NOT NULL REFERENCES deals(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  PRIMARY KEY (deal_id, product_id)
);

CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  activity TEXT NOT NULL,
  type TEXT,                           -- Follow-up | Meeting | Agent Action | Email | Content Drop
  status TEXT,                         -- To Do | In Progress | Done
  due_date TEXT,
  agent TEXT,
  notes TEXT,
  contact_id TEXT REFERENCES contacts(id),
  deal_id TEXT REFERENCES deals(id)
);

CREATE TABLE content (
  id TEXT PRIMARY KEY,
  video_title TEXT NOT NULL,
  lane TEXT,                           -- Authority | Discovery | Conversion
  content_stage TEXT,                  -- Idea | Scripting | Published
  publish_date TEXT,
  hook_angle TEXT,
  impressions INTEGER,
  views INTEGER,
  ctr REAL,
  first_30s_retention REAL,
  on_track TEXT,
  notes TEXT
);

CREATE TABLE content_platforms (       -- "Platforms" (multipleSelects)
  content_id TEXT NOT NULL REFERENCES content(id),
  platform TEXT NOT NULL,
  PRIMARY KEY (content_id, platform)
);

CREATE TABLE content_products (        -- Content.Promotes Products <-> Products.Content (M:N)
  content_id TEXT NOT NULL REFERENCES content(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  PRIMARY KEY (content_id, product_id)
);

CREATE TABLE content_deals (           -- Content.Attributed Deals <-> Deals.Content (M:N)
  content_id TEXT NOT NULL REFERENCES content(id),
  deal_id TEXT NOT NULL REFERENCES deals(id),
  PRIMARY KEY (content_id, deal_id)
);

CREATE TABLE content_leads (           -- Content.Leads Generated -> Contacts (M:N)
  content_id TEXT NOT NULL REFERENCES content(id),
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  PRIMARY KEY (content_id, contact_id)
);

-- ── Content OPS base ─────────────────────────────────────────────────
--
-- Cross-base link resolution: Content OPS has NO Airtable-level link
-- fields back to the CRM base - the two are connected only by matching
-- title text. Verified during Phase 4 export: every populated title in
-- Content OPS matches exactly (case-sensitive, no drift) to a CRM
-- `content` row. One Content Calendar row (Airtable ID
-- recbI4pGQJYcEcKDs) has no title and no other data at all - a true
-- orphan. It gets content_id = NULL rather than being dropped, so the
-- empty record is still visible for the owner to decide whether to
-- delete it or fill it in.

CREATE TABLE content_calendar (
  id TEXT PRIMARY KEY,
  working_title TEXT,                  -- NULL only for the one orphan record (recbI4pGQJYcEcKDs)
  publish_date TEXT,
  lane TEXT,
  hook_angle TEXT,
  status TEXT,
  thumbnail_done INTEGER NOT NULL DEFAULT 0,
  script_done INTEGER NOT NULL DEFAULT 0,
  shorts_done INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  content_id TEXT REFERENCES content(id)   -- resolved by exact title match, see above
);

CREATE TABLE performance (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  publish_date TEXT,
  impressions INTEGER,
  ctr REAL,
  views INTEGER,
  avg_view_duration REAL,
  first_30s_retention REAL,
  on_track TEXT,
  content_id TEXT REFERENCES content(id)   -- resolved by exact title match
);

CREATE TABLE shorts (
  id TEXT PRIMARY KEY,
  short TEXT NOT NULL,
  angle TEXT,
  status TEXT,
  youtube INTEGER NOT NULL DEFAULT 0,
  tiktok INTEGER NOT NULL DEFAULT 0,
  ig_reels INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  content_calendar_id TEXT REFERENCES content_calendar(id)  -- resolved from "Parent Video" text, see mappings doc
);

-- ── Computed views, replacing Airtable rollup/formula fields ─────────

-- NOT filtered by payment_status: verified against source data that the
-- original Airtable rollup sums ALL linked orders regardless of status
-- (Marcus Bell's Lifetime Value of 426 includes a Pending order's amount
-- alongside a Paid one - confirmed while validating this proposal).
CREATE VIEW contact_lifetime_value AS
SELECT c.id AS contact_id, COALESCE(SUM(o.amount), 0) AS lifetime_value
FROM contacts c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id;

-- NOT filtered by deal stage, despite the "Open" in the name: verified
-- against source data that every contact's value equals the sum of ALL
-- their linked deals, including Won ones (e.g. Grace Whitfield's Open
-- Pipeline Value of 5000 comes entirely from her one Won deal). Field
-- name is misleading but this replicates Airtable's actual behavior.
CREATE VIEW contact_open_pipeline_value AS
SELECT c.id AS contact_id, COALESCE(SUM(d.amount), 0) AS open_pipeline_value
FROM contacts c
LEFT JOIN deals d ON d.contact_id = c.id
GROUP BY c.id;

CREATE VIEW deal_weighted_value AS
SELECT id AS deal_id, ROUND(amount * probability, 2) AS weighted_value
FROM deals;

CREATE VIEW deal_days_in_pipeline AS
SELECT id AS deal_id, CAST(julianday('now') - julianday(created) AS INTEGER) AS days_in_pipeline
FROM deals;

CREATE VIEW product_units_sold AS
SELECT p.id AS product_id, COUNT(op.order_id) AS units_sold
FROM products p
LEFT JOIN order_products op ON op.product_id = p.id
GROUP BY p.id;

-- NOT filtered by payment_status: verified against source data (King Of
-- AI course's Revenue Generated of 297 comes from a Pending order).
CREATE VIEW product_revenue_generated AS
SELECT p.id AS product_id, COALESCE(SUM(o.amount), 0) AS revenue_generated
FROM products p
LEFT JOIN order_products op ON op.product_id = p.id
LEFT JOIN orders o ON o.id = op.order_id
GROUP BY p.id;

-- NOT filtered by deal stage: verified against source data ("Stop
-- Prompting Harder"'s Influenced Revenue of 297 comes from a deal still
-- in "Proposal Sent", not Won).
CREATE VIEW content_influenced_revenue AS
SELECT c.id AS content_id, COALESCE(SUM(d.amount), 0) AS influenced_revenue
FROM content c
LEFT JOIN content_deals cd ON cd.content_id = c.id
LEFT JOIN deals d ON d.id = cd.deal_id
GROUP BY c.id;

CREATE INDEX idx_deals_contact ON deals(contact_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_deal ON orders(deal_id);
CREATE INDEX idx_activities_contact ON activities(contact_id);
CREATE INDEX idx_activities_deal ON activities(deal_id);
CREATE INDEX idx_content_calendar_content ON content_calendar(content_id);
CREATE INDEX idx_performance_content ON performance(content_id);
CREATE INDEX idx_shorts_calendar ON shorts(content_calendar_id);
