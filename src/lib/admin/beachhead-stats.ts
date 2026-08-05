import {
  BEACHHEAD_CITIES,
  matchesBeachheadCity,
  type BeachheadCityStats,
} from '@/lib/admin/beachhead-cities'

type CompanionRow = {
  destination_country: string | null
  destination_city: string | null
  status: string | null
  end_date: string | null
}

type SponsorRow = {
  country_code: string
  city: string | null
  status: string | null
}

export function computeBeachheadStats(
  companions: CompanionRow[],
  sponsors: SponsorRow[],
  today: string
): BeachheadCityStats[] {
  return BEACHHEAD_CITIES.map(city => {
    const activePosts = companions.filter(
      p =>
        p.status === 'open' &&
        p.end_date &&
        p.end_date >= today &&
        matchesBeachheadCity(city, p.destination_country, p.destination_city)
    ).length

    const sponsorCount = sponsors.filter(
      s =>
        s.status === 'active' &&
        matchesBeachheadCity(city, s.country_code, s.city)
    ).length

    return {
      id: city.id,
      label: city.label,
      countryCode: city.countryCode,
      activePosts,
      sponsors: sponsorCount,
      targetActivePosts: city.targetActivePosts,
      targetSponsors: city.targetSponsors,
    }
  })
}
