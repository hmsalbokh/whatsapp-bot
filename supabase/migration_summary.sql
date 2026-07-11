-- Add summary columns to existing conversations table if missing
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS summary text;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS summary_generated_at timestamptz;

-- Index for summary lookups
CREATE INDEX IF NOT EXISTS idx_conversations_summary ON conversations(summary_generated_at DESC);
