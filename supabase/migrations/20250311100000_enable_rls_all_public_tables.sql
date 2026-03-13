-- =============================================
-- Supabase Advisor: public 스키마 테이블에 RLS 활성화 (24개 경고 등 해소)
-- 정책이 이미 있는 테이블: RLS만 켬. 정책 없는 테이블은 건너뜀(락 방지).
-- =============================================

DO $$
DECLARE
  r RECORD;
  pol_count integer;
BEGIN
  FOR r IN
    SELECT t.schemaname, t.tablename
    FROM pg_tables t
    WHERE t.schemaname = 'public'
      AND t.tablename NOT IN ('schema_migrations', 'spatial_ref_sys')
  LOOP
    SELECT COUNT(*) INTO pol_count
    FROM pg_policies p
    WHERE p.schemaname = r.schemaname AND p.tablename = r.tablename;
    IF pol_count > 0 THEN
      BEGIN
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', r.schemaname, r.tablename);
        RAISE NOTICE 'RLS enabled: %.%', r.schemaname, r.tablename;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skip %.%: %', r.schemaname, r.tablename, SQLERRM;
      END;
    ELSE
      RAISE NOTICE 'Skip %.% (no policies, add policies first)', r.schemaname, r.tablename;
    END IF;
  END LOOP;
END $$;
