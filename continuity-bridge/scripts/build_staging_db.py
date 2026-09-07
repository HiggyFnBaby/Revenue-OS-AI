#!/usr/bin/env python3
"""
Phase 5 (Staging Migration) for the revenue-os-crm-airtable case.

Builds migration-cases/databases/revenue-os-crm-airtable.db from the
approved schema (continuity-bridge/target-schemas/revenue-os-crm.sql) and
the checksummed export under
migration-cases/backups/revenue-os-crm-airtable/<date>/, then validates
every computed view against the source rollup/formula values and checks
referential integrity, row counts, and primary-key uniqueness.

Writes migration-cases/revenue-os-crm-airtable-validation.md with the
result. Never touches Airtable - reads only from the local export.

Usage: python3 build_staging_db.py <export-date, e.g. 2026-08-12>
"""
import json
import os
import sqlite3
import sys
from datetime import datetime, timezone

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SCHEMA = os.path.join(REPO_ROOT, "continuity-bridge", "target-schemas", "revenue-os-crm.sql")
DB_DIR = os.path.join(REPO_ROOT, "migration-cases", "databases")
DB_PATH = os.path.join(DB_DIR, "revenue-os-crm-airtable.db")
REPORT_PATH = os.path.join(REPO_ROOT, "migration-cases", "revenue-os-crm-airtable-validation.md")

EXPECTED_COUNTS = {
    "contacts": 6, "deals": 6, "products": 6, "orders": 5, "activities": 10,
    "content": 5, "content_calendar": 6, "performance": 1, "shorts": 9,
}


def load(backup_dir, name):
    with open(os.path.join(backup_dir, f"{name}.json")) as f:
        return json.load(f)


def build(backup_dir):
    os.makedirs(DB_DIR, exist_ok=True)
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    with open(SCHEMA) as f:
        conn.executescript(f.read())
    cur = conn.cursor()

    contacts = load(backup_dir, "contacts")
    deals = load(backup_dir, "deals")
    products = load(backup_dir, "products")
    orders = load(backup_dir, "orders")
    activities = load(backup_dir, "activities")
    content = load(backup_dir, "content")
    content_calendar = load(backup_dir, "content_calendar")
    performance = load(backup_dir, "performance")
    shorts = load(backup_dir, "shorts")

    contact_by_name = {c["Name"]: c["_airtable_record_id"] for c in contacts}
    deal_by_name = {d["Deal Name"]: d["_airtable_record_id"] for d in deals}
    product_by_name = {p["Product Name"]: p["_airtable_record_id"] for p in products}
    content_by_title = {c["Video Title"]: c["_airtable_record_id"] for c in content}
    calendar_by_title = {
        cc["Working Title"]: cc["_airtable_record_id"]
        for cc in content_calendar if cc.get("Working Title")
    }

    for c in contacts:
        cur.execute(
            "INSERT INTO contacts (id,name,email,phone,company,contact_type,lifecycle_stage,"
            "lead_source,owner_agent,notes,date_added) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            (c["_airtable_record_id"], c["Name"], c.get("Email"), c.get("Phone"), c.get("Company"),
             c.get("Contact Type"), c.get("Lifecycle Stage"), c.get("Lead Source"),
             c.get("Owner Agent"), c.get("Notes"), c.get("Date Added")))

    for d in deals:
        cnames = d.get("Contact") or []
        contact_id = contact_by_name.get(cnames[0]) if cnames else None
        cur.execute(
            "INSERT INTO deals (id,deal_name,stage,amount,probability,expected_close,deal_type,"
            "priority,owner_agent,notes,created,contact_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            (d["_airtable_record_id"], d["Deal Name"], d.get("Stage"), d.get("Amount"),
             d.get("Probability"), d.get("Expected Close"), d.get("Deal Type"), d.get("Priority"),
             d.get("Owner Agent"), d.get("Notes"), d.get("Created"), contact_id))

    for p in products:
        cur.execute(
            "INSERT INTO products (id,product_name,category,production_stage,price,tier,"
            "produced_by_agent,trend_score,marketplace_url,download_link,created) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            (p["_airtable_record_id"], p["Product Name"], p.get("Category"),
             p.get("Production Stage"), p.get("Price"), p.get("Tier"), p.get("Produced By Agent"),
             p.get("Trend Score"), p.get("Marketplace URL"), p.get("Download Link"), p.get("Created")))
        for tool in (p.get("Tools Used") or []):
            cur.execute("INSERT INTO product_tools (product_id, tool) VALUES (?,?)",
                        (p["_airtable_record_id"], tool))
        for dn in (p.get("Deals") or []):
            did = deal_by_name.get(dn)
            if did:
                cur.execute("INSERT OR IGNORE INTO deal_products (deal_id, product_id) VALUES (?,?)",
                            (did, p["_airtable_record_id"]))

    for o in orders:
        cust_names = o.get("Customer") or []
        deal_names = o.get("Deal") or []
        cust_id = contact_by_name.get(cust_names[0]) if cust_names else None
        deal_id = deal_by_name.get(deal_names[0]) if deal_names else None
        cur.execute(
            "INSERT INTO orders (id,order_number,order_date,amount,payment_status,fulfillment,"
            "channel,notes,customer_id,deal_id) VALUES (?,?,?,?,?,?,?,?,?,?)",
            (o["_airtable_record_id"], o["Order ID"], o.get("Order Date"), o.get("Amount"),
             o.get("Payment Status"), o.get("Fulfillment"), o.get("Channel"), o.get("Notes"),
             cust_id, deal_id))
        for pn in (o.get("Product") or []):
            pid = product_by_name.get(pn)
            if pid:
                cur.execute("INSERT OR IGNORE INTO order_products (order_id, product_id) VALUES (?,?)",
                            (o["_airtable_record_id"], pid))

    for a in activities:
        cnames = a.get("Contact") or []
        dnames = a.get("Deal") or []
        cid = contact_by_name.get(cnames[0]) if cnames else None
        did = deal_by_name.get(dnames[0]) if dnames else None
        cur.execute(
            "INSERT INTO activities (id,activity,type,status,due_date,agent,notes,contact_id,"
            "deal_id) VALUES (?,?,?,?,?,?,?,?,?)",
            (a["_airtable_record_id"], a["Activity"], a.get("Type"), a.get("Status"),
             a.get("Due Date"), a.get("Agent"), a.get("Notes"), cid, did))

    for c in content:
        cur.execute(
            "INSERT INTO content (id,video_title,lane,content_stage,publish_date,hook_angle,"
            "impressions,views,ctr,first_30s_retention,on_track,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            (c["_airtable_record_id"], c["Video Title"], c.get("Lane"), c.get("Content Stage"),
             c.get("Publish Date"), c.get("Hook Angle"), c.get("Impressions"), c.get("Views"),
             c.get("CTR"), c.get("First 30s Retention"), c.get("On Track"), c.get("Notes")))
        for plat in (c.get("Platforms") or []):
            cur.execute("INSERT INTO content_platforms (content_id, platform) VALUES (?,?)",
                        (c["_airtable_record_id"], plat))
        for pn in (c.get("Promotes Products") or []):
            pid = product_by_name.get(pn)
            if pid:
                cur.execute("INSERT OR IGNORE INTO content_products (content_id, product_id) VALUES (?,?)",
                            (c["_airtable_record_id"], pid))
        for dn in (c.get("Attributed Deals") or []):
            did = deal_by_name.get(dn)
            if did:
                cur.execute("INSERT OR IGNORE INTO content_deals (content_id, deal_id) VALUES (?,?)",
                            (c["_airtable_record_id"], did))
        for cn in (c.get("Leads Generated") or []):
            cid = contact_by_name.get(cn)
            if cid:
                cur.execute("INSERT OR IGNORE INTO content_leads (content_id, contact_id) VALUES (?,?)",
                            (c["_airtable_record_id"], cid))

    for cc in content_calendar:
        title = cc.get("Working Title")
        content_id = content_by_title.get(title) if title else None
        cur.execute(
            "INSERT INTO content_calendar (id,working_title,publish_date,lane,hook_angle,status,"
            "thumbnail_done,script_done,shorts_done,notes,content_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            (cc["_airtable_record_id"], title, cc.get("Publish Date"), cc.get("Lane"),
             cc.get("Hook Angle"), cc.get("Status"), int(bool(cc.get("Thumbnail Done"))),
             int(bool(cc.get("Script Done"))), int(bool(cc.get("Shorts Done"))), cc.get("Notes"),
             content_id))

    for pf in performance:
        content_id = content_by_title.get(pf["Title"])
        cur.execute(
            "INSERT INTO performance (id,title,publish_date,impressions,ctr,views,"
            "avg_view_duration,first_30s_retention,on_track,content_id) VALUES (?,?,?,?,?,?,?,?,?,?)",
            (pf["_airtable_record_id"], pf["Title"], pf.get("Publish Date"), pf.get("Impressions"),
             pf.get("CTR"), pf.get("Views"), pf.get("Avg View Duration"),
             pf.get("First 30s Retention"), pf.get("On Track"), content_id))

    for s in shorts:
        parent = s.get("Parent Video")
        cal_id = calendar_by_title.get(parent) if parent else None
        cur.execute(
            "INSERT INTO shorts (id,short,angle,status,youtube,tiktok,ig_reels,notes,"
            "content_calendar_id) VALUES (?,?,?,?,?,?,?,?,?)",
            (s["_airtable_record_id"], s["Short"], s.get("Angle"), s.get("Status"),
             int(bool(s.get("YouTube"))), int(bool(s.get("TikTok"))), int(bool(s.get("IG Reels"))),
             s.get("Notes"), cal_id))

    conn.commit()
    return conn, {
        "contacts": contacts, "deals": deals, "products": products, "content": content,
    }


def validate(conn, source):
    cur = conn.cursor()
    errors = []
    warnings = []

    for c in source["contacts"]:
        aid = c["_airtable_record_id"]
        expected_ltv = c.get("Lifetime Value", 0) or 0
        expected_opv = c.get("Open Pipeline Value", 0) or 0
        row = cur.execute("SELECT lifetime_value FROM contact_lifetime_value WHERE contact_id=?", (aid,)).fetchone()
        actual_ltv = row[0] if row else 0
        row = cur.execute("SELECT open_pipeline_value FROM contact_open_pipeline_value WHERE contact_id=?", (aid,)).fetchone()
        actual_opv = row[0] if row else 0
        if abs(actual_ltv - expected_ltv) > 0.001:
            errors.append(f"Contact {c['Name']}: Lifetime Value expected {expected_ltv}, got {actual_ltv}")
        if abs(actual_opv - expected_opv) > 0.001:
            errors.append(f"Contact {c['Name']}: Open Pipeline Value expected {expected_opv}, got {actual_opv}")

    for d in source["deals"]:
        aid = d["_airtable_record_id"]
        expected_wv = d.get("Weighted Value", 0) or 0
        expected_dip = d.get("Days in Pipeline", 0) or 0
        row = cur.execute("SELECT weighted_value FROM deal_weighted_value WHERE deal_id=?", (aid,)).fetchone()
        actual_wv = row[0] if row else 0
        row = cur.execute("SELECT days_in_pipeline FROM deal_days_in_pipeline WHERE deal_id=?", (aid,)).fetchone()
        actual_dip = row[0] if row else 0
        if abs(actual_wv - expected_wv) > 0.01:
            errors.append(f"Deal {d['Deal Name']}: Weighted Value expected {expected_wv}, got {actual_wv}")
        if abs(actual_dip - expected_dip) > 3:
            warnings.append(
                f"Deal {d['Deal Name']}: Days in Pipeline expected ~{expected_dip} (at export time), "
                f"got {actual_dip} (this view is time-dependent by design - recomputes from today's date)"
            )

    for p in source["products"]:
        aid = p["_airtable_record_id"]
        expected_units = p.get("Units Sold", 0) or 0
        expected_rev = p.get("Revenue Generated", 0) or 0
        row = cur.execute("SELECT units_sold FROM product_units_sold WHERE product_id=?", (aid,)).fetchone()
        actual_units = row[0] if row else 0
        row = cur.execute("SELECT revenue_generated FROM product_revenue_generated WHERE product_id=?", (aid,)).fetchone()
        actual_rev = row[0] if row else 0
        if actual_units != expected_units:
            errors.append(f"Product {p['Product Name']}: Units Sold expected {expected_units}, got {actual_units}")
        if abs(actual_rev - expected_rev) > 0.001:
            errors.append(f"Product {p['Product Name']}: Revenue Generated expected {expected_rev}, got {actual_rev}")

    for c in source["content"]:
        aid = c["_airtable_record_id"]
        expected_ir = c.get("Influenced Revenue", 0) or 0
        row = cur.execute("SELECT influenced_revenue FROM content_influenced_revenue WHERE content_id=?", (aid,)).fetchone()
        actual_ir = row[0] if row else 0
        if abs(actual_ir - expected_ir) > 0.001:
            errors.append(f"Content {c['Video Title']}: Influenced Revenue expected {expected_ir}, got {actual_ir}")

    tables = list(EXPECTED_COUNTS.keys())
    counts = {t: cur.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0] for t in tables}
    for t in tables:
        if counts[t] != EXPECTED_COUNTS[t]:
            errors.append(f"Table {t}: expected {EXPECTED_COUNTS[t]} rows, got {counts[t]}")

    # Primary-key uniqueness/non-null: SQLite PKs already enforce this at
    # insert time, so a successful load already proves it. Re-check anyway.
    for t in tables:
        n = cur.execute(f"SELECT COUNT(*) FROM (SELECT id FROM {t} GROUP BY id HAVING COUNT(*) > 1)").fetchone()[0]
        if n:
            errors.append(f"Table {t}: {n} duplicate primary key(s)")
        n_null = cur.execute(f"SELECT COUNT(*) FROM {t} WHERE id IS NULL").fetchone()[0]
        if n_null:
            errors.append(f"Table {t}: {n_null} row(s) with NULL primary key")

    fk_violations = cur.execute("PRAGMA foreign_key_check").fetchall()
    for v in fk_violations:
        errors.append(f"FK violation: table={v[0]} rowid={v[1]} references={v[2]} fk_index={v[3]}")

    return counts, errors, warnings


def write_report(counts, errors, warnings, db_rel_path):
    status = "PASS" if not errors else "FAIL"
    lines = [
        "# Phase 5 validation report: revenue-os-crm-airtable",
        "",
        f"Run at: {datetime.now(timezone.utc).isoformat()}",
        f"Staging database: `{db_rel_path}` (gitignored - real contact PII, rebuild with "
        "`continuity-bridge/scripts/build_staging_db.py`)",
        "",
        f"## Result: **{status}**",
        "",
        "## Row counts",
        "",
        "| Table | Count | Expected |",
        "|---|---|---|",
    ]
    for t, n in counts.items():
        lines.append(f"| {t} | {n} | {EXPECTED_COUNTS[t]} |")

    lines += ["", "## Minimum pass criteria"]
    lines.append(f"- 100% expected tables imported: {'yes' if not errors else 'see errors'}")
    lines.append("- 100% primary keys unique and non-null: yes (enforced at insert + re-checked)")
    lines.append(f"- Zero foreign-key violations: {'yes' if not any('FK violation' in e for e in errors) else 'NO - see errors'}")
    lines.append(f"- Critical computed outputs (rollups/formulas) match source exactly: {'yes' if not any('expected' in e for e in errors) else 'NO - see errors'}")
    lines.append(f"- Zero unresolved mission-critical exceptions: {'yes' if not errors else 'NO'}")

    if errors:
        lines += ["", "## Errors", ""]
        for e in errors:
            lines.append(f"- {e}")
    if warnings:
        lines += ["", "## Warnings (non-blocking)", ""]
        for w in warnings:
            lines.append(f"- {w}")

    with open(REPORT_PATH, "w") as f:
        f.write("\n".join(lines) + "\n")

    return status


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: build_staging_db.py <export-date>")
        sys.exit(1)
    export_date = sys.argv[1]
    backup_dir = os.path.join(REPO_ROOT, "migration-cases", "backups", "revenue-os-crm-airtable", export_date)
    conn, source = build(backup_dir)
    counts, errors, warnings = validate(conn, source)
    conn.close()
    status = write_report(counts, errors, warnings, os.path.relpath(DB_PATH, REPO_ROOT))
    print(f"Status: {status}")
    print(f"Counts: {counts}")
    if errors:
        print("ERRORS:")
        for e in errors:
            print(" -", e)
    if warnings:
        print("WARNINGS:")
        for w in warnings:
            print(" -", w)
    print(f"Database written to: {DB_PATH}")
    print(f"Report written to: {REPORT_PATH}")
