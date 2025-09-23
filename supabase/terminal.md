# supabaseからスキーマを全取得
export SUPABASE_DB_URL=
supabase db dump \
  --db-url "postgres://postgres.zylkbsmbxctfdwatifxi:@Ohnomasaya3204@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres" \
  -s public,auth,storage \
  -f supabase/schema.sql 

# 権限/ロールを取得
supabase db dump \
  --db-url "postgres://postgres.zylkbsmbxctfdwatifxi:@Ohnomasaya3204@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres" \
  --role-only \
  -f supabase/roles.sql 

supabase functions secrets set \ SUPABASE_URL="https://zylkbsmbxctfdwatifxi.supabase.co" \ SUPABASE_SERVICE_ROLE_KEY="<サービスロールキー>" \ RESEND_API_KEY="<ResendのAPIキー>" \ WEBHOOK_SECRET="<任意の長い秘密文字列>" \ SITE_URL="https://veenis.vercel.app"