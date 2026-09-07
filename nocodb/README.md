# NocoDB

A self-hosted [NocoDB](https://nocodb.com/) instance backed by Postgres, for
spreadsheet-style browsing/editing of this project's data outside the main
`app/` CRM.

## Run it

```bash
cd nocodb
cp .env.example .env
# fill in NC_DB_PASSWORD and NC_AUTH_JWT_SECRET in .env
docker compose up -d
```

NocoDB will be available at http://localhost:8080. Data persists in the
`nocodb_pg_data` and `nocodb_app_data` Docker volumes.

## Browsing the migrated Revenue OS CRM data

`migration-cases/databases/` is bind-mounted into the container at
`/data/migration-cases`, so the SQLite database built by
[`continuity-bridge/scripts/build_staging_db.py`](../continuity-bridge/scripts/build_staging_db.py)
can be added as a data source:

1. In NocoDB, go to your base → **Data Sources** → **New Data Source**
2. Choose **SQLite**
3. Set the file path to `/data/migration-cases/revenue-os-crm-airtable.db`
4. Save — the `contacts`, `deals`, `products`, `orders`, `activities`,
   `content`, `content_calendar`, `performance`, and `shorts` tables (plus
   the computed views like `contact_lifetime_value`) show up as grids you
   can browse, filter, and build kanban/form views on top of.

If the database doesn't exist yet, build it first with
`python3 continuity-bridge/scripts/build_staging_db.py 2026-08-12` from
the repo root (see
[`migration-cases/revenue-os-crm-airtable.md`](../migration-cases/revenue-os-crm-airtable.md)
for the full case).
