import { guessSourceLang } from './detect-language'

describe('guessSourceLang', () => {
  it('고유 문자를 쓰는 언어를 알아낸다', () => {
    expect(guessSourceLang('안녕하세요, 오늘 날씨 좋네요')).toBe('ko')
    expect(guessSourceLang('こんにちは、元気ですか')).toBe('ja')
    expect(guessSourceLang('สวัสดีครับ')).toBe('th')
    expect(guessSourceLang('مرحبا كيف حالك')).toBe('ar')
    expect(guessSourceLang('שלום מה נשמע')).toBe('he')
    expect(guessSourceLang('Привет, как дела')).toBe('ru')
    expect(guessSourceLang('नमस्ते आप कैसे हैं')).toBe('hi')
    expect(guessSourceLang('আপনি কেমন আছেন')).toBe('bn')
    expect(guessSourceLang('Γεια σου τι κάνεις')).toBe('el')
  })

  it('가나가 있으면 한자가 섞여 있어도 일본어로 본다', () => {
    // 일본어 문장에는 한자가 늘 섞이므로 가나를 먼저 봐야 한다.
    expect(guessSourceLang('東京に行きました')).toBe('ja')
  })

  it('가나 없이 한자만 있으면 중국어로 본다', () => {
    expect(guessSourceLang('你好，今天天气很好')).toBe('zh')
  })

  it('라틴 문자는 구분할 수 없으므로 영어로 본다', () => {
    // 채팅 사용자 대부분이 공통어로 영어를 쓰기 때문에 손해가 작은 가정이다.
    expect(guessSourceLang('Hello, how are you?')).toBe('en')
    expect(guessSourceLang('Bonjour, comment ça va')).toBe('en')
  })

  it('문자가 하나만 섞여 있어도 찾아낸다', () => {
    expect(guessSourceLang('OK 좋아요')).toBe('ko')
  })

  it('문자가 없으면 영어로 떨어진다', () => {
    expect(guessSourceLang('')).toBe('en')
    expect(guessSourceLang('123 !!! 😀')).toBe('en')
  })
})
