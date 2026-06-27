import { z } from "zod";
import pool from "../db.js";

const uuidStr = z.string().uuid();

const tzRegex = /^[A-Za-z_]+(\/[A-Za-z_]+)+$/;

export const updateSettingsSchema = z.object({
  currency: z.string().length(3).regex(/^[A-Z]{3}$/).optional(),
  locale: z.string().min(2).max(20).optional(),
  timezone: z.string().regex(tzRegex).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  first_day_of_week: z.enum(["monday", "sunday"]).optional(),
  date_format: z.string().min(1).max(20).optional(),
  number_format: z.enum(["1,234.56", "1 234,56", "1.234,56"]).optional(),
  budget_alert_threshold: z.number().min(0.5).max(1.0).optional(),
  goal_alert_days: z.number().int().positive().optional(),
  notifications_enabled: z.boolean().optional(),
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  weekly_summary_enabled: z.boolean().optional(),
  monthly_summary_enabled: z.boolean().optional(),
  default_budget_period: z.enum(["weekly", "monthly", "yearly"]).optional(),
  default_budget_strictness: z.enum(["soft", "hard"]).optional(),
  default_goal_priority: z.enum(["low", "medium", "high"]).optional(),
  dashboard_compact_mode: z.boolean().optional(),
  large_expense_threshold: z.number().min(0).optional(),
});

export async function initializeDefaults(userId) {
  const { rows } = await pool.query(
    `INSERT INTO user_settings (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING
     RETURNING *`,
    [userId]
  );
  return rows[0] || null;
}

export function rowToSettings(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    currency: row.currency,
    locale: row.locale,
    timezone: row.timezone,
    theme: row.theme,
    first_day_of_week: row.first_day_of_week,
    date_format: row.date_format,
    number_format: row.number_format,
    budget_alert_threshold: Number(row.budget_alert_threshold),
    goal_alert_days: row.goal_alert_days,
    notifications_enabled: row.notifications_enabled,
    email_notifications: row.email_notifications,
    push_notifications: row.push_notifications,
    weekly_summary_enabled: row.weekly_summary_enabled,
    monthly_summary_enabled: row.monthly_summary_enabled,
    default_budget_period: row.default_budget_period,
    default_budget_strictness: row.default_budget_strictness,
    default_goal_priority: row.default_goal_priority,
    dashboard_compact_mode: row.dashboard_compact_mode,
    large_expense_threshold: Number(row.large_expense_threshold),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getSettings(userId) {
  let { rows } = await pool.query(
    `SELECT * FROM user_settings WHERE user_id = $1`,
    [userId]
  );
  if (rows.length === 0) {
    const created = await initializeDefaults(userId);
    return rowToSettings(created);
  }
  return rowToSettings(rows[0]);
}

export async function updateSettings(userId, data) {
  const fields = [];
  const params = [];
  let idx = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = $${idx++}`);
      params.push(value);
    }
  }

  if (fields.length === 0) {
    return getSettings(userId);
  }

  fields.push(`updated_at = NOW()`);
  params.push(userId);

  const { rows } = await pool.query(
    `UPDATE user_settings SET ${fields.join(", ")}
     WHERE user_id = $${idx}
     RETURNING *`,
    params
  );
  return rowToSettings(rows[0] || null);
}

export async function resetSettings(userId) {
  const { rows } = await pool.query(
    `UPDATE user_settings
     SET
       currency = 'INR',
       locale = 'en-IN',
       timezone = 'Asia/Kolkata',
       theme = 'system',
       first_day_of_week = 'monday',
       date_format = 'DD/MM/YYYY',
       number_format = '1,234.56',
       budget_alert_threshold = 0.80,
       goal_alert_days = 14,
       notifications_enabled = true,
       email_notifications = true,
       push_notifications = false,
       weekly_summary_enabled = true,
       monthly_summary_enabled = true,
       default_budget_period = 'monthly',
       default_budget_strictness = 'soft',
       default_goal_priority = 'medium',
       dashboard_compact_mode = false,
       large_expense_threshold = 10000.00,
       updated_at = NOW()
     WHERE user_id = $1
     RETURNING *`,
    [userId]
  );
  return rowToSettings(rows[0] || null);
}
