import { signInWithFacebook } from './actions'

interface Props {
  locale: string
}

/**
 * Google/Apple과 동일한 방식: Server Action + form submit.
 * 클릭 시 서버에서 직접 redirect(data.url)로 Supabase OAuth URL로 보냄.
 * 별도 API 라우트나 <a> 링크 없이 같은 탭에서 이동하는 가장 단순한 방법.
 */
export default function FacebookLoginButton({ locale }: Props) {
  return (
    <form>
      <input type="hidden" name="locale" value={locale} />
      <button
        type="submit"
        formAction={signInWithFacebook}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-[#1877F2] bg-[#1877F2] hover:bg-[#166FE5] transition-all font-semibold text-white text-sm shadow-sm"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="shrink-0">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        <span className="flex-1 text-center">Continue with Facebook</span>
      </button>
    </form>
  )
}
