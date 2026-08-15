# Phase 5 validation report: revenue-os-crm-airtable

Run at: 2026-08-15T02:47:38.208169+00:00
Staging database: `migration-cases/databases/revenue-os-crm-airtable.db` (gitignored - real contact PII, rebuild with `continuity-bridge/scripts/build_staging_db.py`)

## Result: **PASS**

## Row counts

| Table | Count | Expected |
|---|---|---|
| contacts | 6 | 6 |
| deals | 6 | 6 |
| products | 6 | 6 |
| orders | 5 | 5 |
| activities | 10 | 10 |
| content | 5 | 5 |
| content_calendar | 6 | 6 |
| performance | 1 | 1 |
| shorts | 9 | 9 |

## Minimum pass criteria
- 100% expected tables imported: yes
- 100% primary keys unique and non-null: yes (enforced at insert + re-checked)
- Zero foreign-key violations: yes
- Critical computed outputs (rollups/formulas) match source exactly: yes
- Zero unresolved mission-critical exceptions: yes
