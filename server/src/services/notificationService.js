import pool from "../db.js";

export async function createNotification({ user_id, type, title, message, severity, metadata }) {
  const { rows } = await pool.query(
    `INSERT INTO notifications (user_id, type, title, message, severity, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [user_id, type, title, message, severity, JSON.stringify(metadata || {})]
  );
  return rows[0];
}

export async function listNotifications(userId, { limit = 50, offset = 0, type, severity } = {}) {
  const conditions = ["n.user_id = $1 AND n.archived_at IS NULL"];
  const params = [userId];
  let idx = 2;

  if (type) {
    conditions.push(`n.type = $${idx++}`);
    params.push(type);
  }
  if (severity) {
    conditions.push(`n.severity = $${idx++}`);
    params.push(severity);
  }

  const where = conditions.join(" AND ");

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM notifications n WHERE ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const { rows } = await pool.query(
    `SELECT * FROM notifications n
     WHERE ${where}
     ORDER BY n.created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset]
  );

  return { notifications: rows, total };
}

export async function markRead(id, userId) {
  const { rows } = await pool.query(
    `UPDATE notifications SET read_at = NOW()
     WHERE id = $1 AND user_id = $2 AND archived_at IS NULL
     RETURNING *`,
    [id, userId]
  );
  return rows[0] || null;
}

export async function markAllRead(userId) {
  const { rowCount } = await pool.query(
    `UPDATE notifications SET read_at = NOW()
     WHERE user_id = $1 AND read_at IS NULL AND archived_at IS NULL`,
    [userId]
  );
  return rowCount;
}

export async function archive(id, userId) {
  const { rows } = await pool.query(
    `UPDATE notifications SET archived_at = NOW()
     WHERE id = $1 AND user_id = $2 AND archived_at IS NULL
     RETURNING *`,
    [id, userId]
  );
  return rows[0] || null;
}

export async function getUnreadCount(userId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) FROM notifications
     WHERE user_id = $1 AND read_at IS NULL AND archived_at IS NULL`,
    [userId]
  );
  return parseInt(rows[0].count, 10);
}
