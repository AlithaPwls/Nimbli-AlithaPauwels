const PHOTON_API = 'https://photon.komoot.io/api/'
/** Rough bbox for Belgium + Netherlands (minLon, minLat, maxLon, maxLat). */
const BENELUX_BBOX = '2.5,49.4,7.2,53.6'

export function formatAddressFromPhoton(properties) {
  const streetPart = [properties.street || properties.name, properties.housenumber]
    .filter(Boolean)
    .join(' ')
  const cityPart = [properties.postcode, properties.city].filter(Boolean).join(' ')
  return [streetPart, cityPart].filter((part) => part?.trim()).join(', ')
}

export function suggestionFromPhotonFeature(feature) {
  const properties = feature?.properties ?? {}
  const line1 = [properties.street || properties.name, properties.housenumber]
    .filter(Boolean)
    .join(' ')
  const line2 = [properties.postcode, properties.city].filter(Boolean).join(' ')
  const value = formatAddressFromPhoton(properties)
  const id = String(feature?.properties?.osm_id ?? value)

  return {
    id,
    line1: line1 || value,
    line2,
    value,
  }
}

export async function searchPhotonAddresses(query, { signal } = {}) {
  const trimmed = query.trim()
  if (trimmed.length < 3) return []

  const params = new URLSearchParams({
    q: trimmed,
    lang: 'default',
    limit: '6',
    bbox: BENELUX_BBOX,
  })

  const response = await fetch(`${PHOTON_API}?${params}`, { signal })
  if (!response.ok) {
    throw new Error('Adreszoekopdracht mislukt')
  }

  const payload = await response.json()
  const features = Array.isArray(payload?.features) ? payload.features : []
  const seen = new Set()

  return features
    .map(suggestionFromPhotonFeature)
    .filter((item) => {
      if (!item.value || seen.has(item.value)) return false
      seen.add(item.value)
      return true
    })
}
