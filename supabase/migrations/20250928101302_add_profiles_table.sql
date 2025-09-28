-- 1) カラム追加（既存行も NOT NULL にできるよう DEFAULT true）
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notifications_enabled boolean NOT NULL DEFAULT true;

-- 念のため NULL を埋める（IF NOT EXISTS 後でも安全ネット）
UPDATE public.profiles
SET notifications_enabled = true
WHERE notifications_enabled IS NULL;

-- 2) RLS有効化（既に有効ならそのまま）
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3) 本人のみ更新可ポリシーが無い場合だけ作成
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'profiles'
      AND policyname = 'profiles_update_self_notifications'
  ) THEN
    CREATE POLICY "profiles_update_self_notifications"
      ON public.profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;
