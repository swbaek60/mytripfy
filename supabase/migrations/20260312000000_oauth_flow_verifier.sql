-- OAuth PKCE code_verifier 임시 저장 (서버리스 멀티 인스턴스에서 콜백이 동일 verifier 조회 가능하도록)
-- service_role로만 접근하며, TTL 후 정리용으로 expires_at 사용
CREATE TABLE IF NOT EXISTS public.oauth_flow_verifier (
  flow_id text PRIMARY KEY,
  code_verifier text NOT NULL,
  expires_at timestamptz NOT NULL
);

ALTER TABLE public.oauth_flow_verifier ENABLE ROW LEVEL SECURITY;

-- anon/authenticated 정책 없음 → service_role만 접근 가능

COMMENT ON TABLE public.oauth_flow_verifier IS 'OAuth PKCE code_verifier temporary store; server-only (service_role).';
