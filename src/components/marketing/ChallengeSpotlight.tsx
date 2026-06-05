import Link from 'next/link'
import Image from 'next/image'

interface CertItem {
  user_id: string
  challenge_id: string
  image_url: string
  title: string
  userName: string
  points: number
}

interface Props {
  certs: CertItem[]
  locale: string
  title: string
  subtitle: string
  viewAllLabel: string
}

export default function ChallengeSpotlight({ certs, locale, title, subtitle, viewAllLabel }: Props) {
  if (certs.length === 0) return null

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-challenge-light text-challenge text-xs font-bold mb-3">
            🏆 Challenges
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-heading">{title}</h2>
          <p className="text-subtle mt-2 text-sm">{subtitle}</p>
        </div>
        <Link
          href={`/${locale}/challenges/feed`}
          className="text-sm font-semibold text-challenge hover:underline shrink-0"
        >
          {viewAllLabel} →
        </Link>
      </div>
      <div className="ds-carousel-track -mx-4 px-4 sm:mx-0 sm:px-0">
        {certs.map(cert => (
          <Link
            key={`${cert.user_id}-${cert.challenge_id}`}
            href={`/${locale}/challenges/feed`}
            className="relative w-[200px] sm:w-[220px] aspect-[3/4] rounded-2xl overflow-hidden group shrink-0"
          >
            <Image
              src={cert.image_url}
              alt={cert.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="220px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-white text-xs font-semibold line-clamp-2">{cert.title}</p>
              <p className="text-white/70 text-[10px] mt-1">{cert.userName} · {cert.points} pts</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
