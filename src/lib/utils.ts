import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 번역 API 등에서 오는 HTML 엔티티(&#39;, &quot; 등)를 실제 문자로 복원 (표시용) */
export function decodeHtmlEntities(text: string | null | undefined): string {
  if (text == null || text === '') return ''
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}
