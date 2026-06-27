DROP TABLE IF EXISTS goals;

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(12, 2) NOT NULL CHECK (target_amount > 0),
  current_saved_amount DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (current_saved_amount >= 0),
  target_date DATE,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_goals_user ON goals(user_id);
CREATE INDEX idx_goals_archived ON goals(archived_at);
CREATE INDEX idx_goals_status ON goals(status);
