-- ContinuityBridge AI local database schema (SQLite-compatible).
-- See ../continuity-bridge/README.md for the full system this backs.

PRAGMA foreign_keys = ON;

CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  service_mode TEXT NOT NULL CHECK(service_mode IN ('SINGLE_CLIENT','TEAM')),
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE migration_cases (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  source_platform TEXT NOT NULL DEFAULT 'AIRTABLE',
  target_backend TEXT NOT NULL DEFAULT 'SQLITE',
  trial_expires_at TEXT,
  strategy TEXT CHECK(strategy IN ('STAY','HYBRID_TRANSITION','MIGRATE')),
  phase TEXT NOT NULL DEFAULT 'INTAKE',
  risk_level TEXT NOT NULL DEFAULT 'UNKNOWN',
  owner_id TEXT NOT NULL,
  rollback_window_ends_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dependencies (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES migration_cases(id),
  asset_type TEXT NOT NULL,
  source_ref TEXT NOT NULL,
  name TEXT NOT NULL,
  criticality TEXT NOT NULL,
  replacement_method TEXT,
  downgrade_impact TEXT NOT NULL DEFAULT 'UNKNOWN',
  evidence TEXT,
  verified_at TEXT
);

CREATE TABLE field_mappings (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES migration_cases(id),
  source_table TEXT NOT NULL,
  source_field TEXT NOT NULL,
  source_type TEXT,
  target_table TEXT NOT NULL,
  target_field TEXT NOT NULL,
  target_type TEXT,
  transform_rule TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT'
);

CREATE TABLE decision_scores (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES migration_cases(id),
  factor TEXT NOT NULL,
  score INTEGER NOT NULL CHECK(score BETWEEN 1 AND 5),
  weight INTEGER NOT NULL,
  evidence TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE approvals (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES migration_cases(id),
  gate TEXT NOT NULL CHECK(gate IN ('A_SCOPE','B_STRATEGY','C_MAPPING','D_CUTOVER','RETIREMENT')),
  decision TEXT NOT NULL CHECK(decision IN ('APPROVED','REJECTED','CHANGES_REQUESTED')),
  approver_id TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE validation_runs (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES migration_cases(id),
  environment TEXT NOT NULL CHECK(environment IN ('STAGING','PRODUCTION')),
  validator_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('PASS','FAIL','PASS_WITH_WAIVERS')),
  expected_records INTEGER,
  actual_records INTEGER,
  critical_exceptions INTEGER NOT NULL DEFAULT 0,
  report_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workflow_tasks (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES migration_cases(id),
  phase TEXT NOT NULL,
  task_type TEXT NOT NULL,
  title TEXT NOT NULL,
  assignee_id TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  due_at TEXT,
  requires_approval INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE support_cases (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  migration_case_id TEXT REFERENCES migration_cases(id),
  requester_id TEXT,
  severity TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  resolution TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT
);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  case_id TEXT REFERENCES migration_cases(id),
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  result TEXT NOT NULL,
  evidence_ref TEXT,
  rollback_ref TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cases_tenant ON migration_cases(tenant_id);
CREATE INDEX idx_dependencies_case ON dependencies(case_id);
CREATE INDEX idx_tasks_case_status ON workflow_tasks(case_id, status);
CREATE INDEX idx_audit_tenant_time ON audit_events(tenant_id, created_at);
