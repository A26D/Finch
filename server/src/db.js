import pg from "pg";
import "dotenv/config";

const pool = new pg.Pool({
  ...(process.env.PGHOST ? { host: process.env.PGHOST } : {}),
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  ...(process.env.PGPASSWORD ? { password: process.env.PGPASSWORD } : {}),
});

export default pool;
