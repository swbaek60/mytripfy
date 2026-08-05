import Image from 'next/image'
import { isOptimizableImageUrl } from '@/lib/image-hosts'

interface SmartImageProps {
  src: string
  alt: string
  /**
   * 최적화 요청 해상도. 표시 크기는 className(보통 `w-full h-full`)이 결정하고,
   * 이 값은 next/image 가 만들 원본 후보의 크기·종횡비 힌트로만 쓰인다.
   */
  width?: number
  height?: number
  /** 뷰포트별 표시 폭. 지정하면 srcset 후보가 실제 표시 크기에 맞게 좁혀진다. */
  sizes?: string
  className?: string
  /** LCP 이미지에만 쓴다. */
  priority?: boolean
  /** 원본 비율 그대로 보여줄 때(라이트박스 등). object-fit 은 className 으로 준다. */
  unoptimizedFallbackTitle?: string
  onClick?: (e: React.MouseEvent<HTMLImageElement>) => void
  draggable?: boolean
}

/**
 * 콘텐츠 이미지(인증샷·커버·로고·갤러리).
 *
 * 허용 호스트(Supabase Storage, 로컬 `/public`)면 next/image 로 리사이즈·WebP 변환을
 * 거치고, 허용 목록 밖 호스트면 최적화 없이 그대로 렌더한다. 호출부마다 이 분기와
 * eslint 예외를 복사하지 않도록 여기 한 곳에 모았다.
 *
 * `fill` 대신 width/height + `w-full h-full` 조합을 쓴다. `fill` 은 부모에
 * `position: relative` 를 요구해서 기존 레이아웃을 조용히 깨뜨릴 수 있다.
 */
export default function SmartImage({
  src,
  alt,
  width = 800,
  height = 800,
  sizes,
  className = '',
  priority = false,
  unoptimizedFallbackTitle,
  onClick,
  draggable,
}: SmartImageProps) {
  if (isOptimizableImageUrl(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        title={unoptimizedFallbackTitle}
        onClick={onClick}
        draggable={draggable}
        className={className}
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- 허용 목록 밖 호스트는 next/image 로 넘길 수 없다.
    <img
      src={src}
      alt={alt}
      title={unoptimizedFallbackTitle}
      onClick={onClick}
      draggable={draggable}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
    />
  )
}
