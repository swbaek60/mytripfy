import Link from 'next/link'
import Image from 'next/image'
import { getDestinationCover } from '@/data/destination-covers'

interface Destination {
  code: string
  name: string
}

interface Props {
  destinations: Destination[]
  locale: string
  viewAllLabel: string
}

export default function DestinationCarousel({ destinations, locale, viewAllLabel }: Props) {
  return (
    <div>
      <div className="ds-carousel-track -mx-4 px-4 sm:mx-0 sm:px-0">
        {destinations.map(dest => (
          <Link
            key={dest.code}
            href={`/${locale}/companions?country=${dest.code}`}
            className="relative w-[260px] sm:w-[280px] h-[340px] rounded-2xl overflow-hidden group shrink-0 snap-start"
          >
            <Image
              src={getDestinationCover(dest.code)}
              alt={dest.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="280px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">{dest.code}</p>
              <h3 className="text-white text-xl font-bold">{dest.name}</h3>
            </div>
          </Link>
        ))}
        <Link
          href={`/${locale}/companions`}
          className="relative w-[200px] h-[340px] rounded-2xl overflow-hidden shrink-0 snap-start flex items-center justify-center bg-brand-light border-2 border-dashed border-brand/30 hover:border-brand transition-colors"
        >
          <span className="text-brand font-bold text-sm">{viewAllLabel} →</span>
        </Link>
      </div>
    </div>
  )
}
