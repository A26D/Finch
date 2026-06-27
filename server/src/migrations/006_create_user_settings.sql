CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'INR',
  locale TEXT NOT NULL DEFAULT 'en-IN',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  first_day_of_week TEXT NOT NULL DEFAULT 'monday' CHECK (first_day_of_week IN ('monday', 'sunday')),
  date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
  number_format TEXT NOT NULL DEFAULT '1,234.56',
  budget_alert_threshold DECIMAL(3,2) NOT NULL DEFAULT 0.80 CHECK (budget_alert_threshold >= 0.5 AND budget_alert_threshold <= 1.0),
  goal_alert_days INTEGER NOT NULL DEFAULT 14 CHECK (goal_alert_days > 0),
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT false,
  weekly_summary_enabled BOOLEAN NOT NULL DEFAULT true,
  monthly_summary_enabled BOOLEAN NOT NULL DEFAULT true,
  default_budget_period TEXT NOT NULL DEFAULT 'monthly' CHECK (default_budget_period IN ('weekly', 'monthly', 'yearly')),
  default_budget_strictness TEXT NOT NULL DEFAULT 'soft' CHECK (default_budget_strictness IN ('soft', 'hard')),
  default_goal_priority TEXT NOT NULL DEFAULT 'medium' CHECK (default_goal_priority IN ('low', 'medium', 'high')),
  dashboard_compact_mode BOOLEAN NOT NULL DEFAULT false,
  large_expense_threshold DECIMAL(12, 2) NOT NULL DEFAULT 10000.00 CHECK (large_expense_threshold >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_settings_user ON user_settings(user_id);
