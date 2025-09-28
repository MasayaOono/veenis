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


# resendのAPIキー
re_Dkwt42Tf_KJps6RvieX4XzmyhDmMAHVsE

# supabaseのdb_schemaをdevからprodにpushする
supabase projects list
supabase link --project-ref dmyujzosvmbidsxjttet
supabase db pull --schema public

supabase link --project-ref zylkbsmbxctfdwatifxi
supabase db dump -f prod_schema_backup.sql --schema-only
supabase db execute -f ./supabase/schema.sql