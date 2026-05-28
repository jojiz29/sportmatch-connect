-- Notification Table and Indices Setup
CREATE TABLE IF NOT EXISTS public.notifications (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('FOLLOW', 'SQUAD_INVITE', 'TRANSACTION_SUCCESS', 'AD_IMPRESSION')),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  link VARCHAR(255),
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications(is_read);
