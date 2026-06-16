import pg from 'pg';
import fs from 'node:fs';

const env = fs.readFileSync('.env', 'utf-8');
for (const line of env.split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i === -1) continue;
  const k = t.slice(0, i).trim();
  const v = t.slice(i + 1).trim();
  if (/^[A-Z_][A-Z0-9_]*$/.test(k) && !process.env[k]) process.env[k] = v;
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('No DATABASE_URL in .env');
  process.exit(1);
}

const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await c.connect();

const r = await c.query(`
  SELECT
    t.table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name))) AS size,
    COALESCE(
      (SELECT n_live_tup FROM pg_stat_user_tables
       WHERE schemaname = 'public' AND relname = t.table_name),
      0
    ) AS rows
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
  ORDER BY t.table_name;
`);

const tables = r.rows;
let totalRows = 0;
console.log('| Tabla | Filas | Tamaño |');
console.log('|---|---:|---:|');
for (const row of tables) {
  const n = Number(row.rows) || 0;
  totalRows += n;
  console.log(`| ${row.table_name} | ${n} | ${row.size} |`);
}
console.log(`\n**Total: ${tables.length} tablas, ${totalRows} filas estimadas.**`);

const fns = await c.query(`
  SELECT count(*) AS n FROM pg_proc
  WHERE pronamespace = 'public'::regnamespace AND prokind IN ('f', 'p');
`);
console.log(`\n**Funciones RPC: ${fns.rows[0].n}**`);

const trgs = await c.query(`
  SELECT count(*) AS n
  FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE NOT t.tgisinternal AND n.nspname = 'public';
`);
console.log(`**Triggers: ${trgs.rows[0].n}**`);

const pols = await c.query(`SELECT count(*) AS n FROM pg_policies WHERE schemaname = 'public';`);
console.log(`**RLS policies: ${pols.rows[0].n}**`);

const indices = await c.query(`
  SELECT count(*) AS n FROM pg_indexes WHERE schemaname = 'public';
`);
console.log(`**Índices: ${indices.rows[0].n}**`);

const enums = await c.query(`
  SELECT count(*) AS n FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
  WHERE n.nspname = 'public' AND typtype = 'e';
`);
console.log(`**Tipos ENUM: ${enums.rows[0].n}**`);

const ext = await c.query(`SELECT extname FROM pg_extension WHERE extname IN ('postgis', 'pg_trgm', 'uuid-ossp', 'pgcrypto');`);
console.log(`**Extensiones: ${ext.rows.map(x => x.extname).join(', ')}**`);

await c.end();
