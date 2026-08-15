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
