import Image from 'next/image'
import { isOptimizableImageUrl } from '@/lib/image-hosts'

interface AvatarProps {
  src?: string | null
  /** 이니셜 폴백과 대체 텍스트에 쓰인다. */
  name?: string | null
  /**
   * 요청할 이미지 크기(px). 표시 크기도 이 값으로 고정된다.
   * `fill` 을 켜면 표시 크기는 부모가 정하고 이 값은 최적화 해상도로만 쓰인다.
   */
  size?: number
  /** 부모 박스를 100% 채운다. 반응형 크기를 부모 클래스로 제어할 때 사용한다. */
  fill?: boolean
  className?: string
  /** 폴백 배경/글자색. 페이지 톤에 맞출 때만 지정한다. */
  fallbackClassName?: string
  priority?: boolean
}

/**
 * 사용자 아바타. 이미지가 없으면 이름 이니셜로 폴백한다.
 *
 * 이전에는 여러 파일이 각자 `<img>` + 이모지 폴백을 복사해 두어서 크기·라운딩·
 * 대체 텍스트가 모두 달랐다. 아바타는 항상 이 컴포넌트를 쓴다.
 * 허용된 호스트면 next/image 로 최적화하고, 그 외에는 그대로 렌더한다.
 */
export default function Avatar({
  src,
  name,
  size = 40,
  fill = false,
  className = '',
  fallbackClassName = 'bg-surface-sunken text-subtle',
  priority = false,
}: AvatarProps) {
  const box = fill ? undefined : { width: size, height: size }
  const shapeClass = fill ? 'w-full h-full' : 'shrink-0'

  if (src) {
    const imgClass = `rounded-full object-cover ${shapeClass} ${className}`
    // 이름이 없는 목록 아바타는 옆에 이름 텍스트가 함께 있으므로 장식으로 취급한다.
    const alt = name ?? ''

    if (isOptimizableImageUrl(src)) {
      return (
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          sizes={`${size}px`}
          priority={priority}
          style={box}
          className={imgClass}
        />
      )
    }
    // eslint-disable-next-line @next/next/no-img-element -- 허용 목록 밖 호스트는 최적화할 수 없다.
    return <img src={src} alt={alt} style={box} className={imgClass} />
  }

  return (
    <div
      aria-hidden
      // 폴백 이니셜은 박스 크기에 비례해 커진다. fill 이면 글자 크기는 부모가 정한다.
      style={box && { ...box, fontSize: Math.max(11, Math.round(size * 0.42)) }}
      className={`rounded-full flex items-center justify-center font-bold select-none ${shapeClass} ${fallbackClassName} ${className}`}
    >
      {name?.trim()?.[0]?.toUpperCase() ?? '👤'}
    </div>
  )
}
