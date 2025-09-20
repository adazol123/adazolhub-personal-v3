/* eslint-disable @next/next/no-before-interactive-script-outside-document */
import Script from 'next/script'

type Occupation = {
  type: string
  name?: string
  startDate?: string
  endDate?: string
  ocupation?: Occupation
}

type Address = {
  addressRegion: string
  addressLocality: string
  postalCode?: string
}

type Alumni = {
  name: string
  sameAs?: string
  logo?: string
  startDate?: string
  endDate?: string
}

export type PersonSchemaProps = {
  jobTitle: string
  name: string
  givenName?: string
  familyName?: string
  gender?: string
  nationality?: string
  description: string
  telephone?: string
  email?: string
  knowsAbout?: string[] | string
  skills?: string[] | string
  brand?: string[] | string
  url?: string[] | string
  sameAs?: string
  image?: string[] | string
  hasOccupation?: Occupation[]
  address?: Address
  alumni?: Alumni
}

// Add schema.org Person markup for improved SEO
export const PersonSchema = (person: PersonSchemaProps) => {
  return (
    <Script
      id='person__schema'
      type='application/ld+json'
      strategy='beforeInteractive'
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Person',
          ...person,
          address: !!person?.address
            ? {
                '@type': 'PostalAddress',
                ...person.address
              }
            : undefined,
          hasOccupation: !!person?.hasOccupation
            ? person.hasOccupation.map(occupation => ({
                '@type': occupation.type,
                name: occupation?.name,
                hasOccupation: occupation.ocupation,
                stardDate: occupation?.startDate,
                endDate: occupation?.endDate
              }))
            : undefined,
          alumniOf: !!person?.alumni
            ? {
                '@type': 'OrganizationRole',
                alumniOf: {
                  '@type': 'CollegeOrUniversity',
                  name: person.alumni.name,
                  sameAs: person.alumni?.sameAs
                },
                startDate: person.alumni?.startDate,
                endDate: person.alumni?.endDate
              }
            : undefined
        })
      }}
    />
  )
}
