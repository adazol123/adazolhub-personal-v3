import SocialCard from '@/components/ui/cards/social-card'
import * as Icons from '@tabler/icons-react'
import CoreCompetencies from './(personal)/(home)/_components/competencies.section'
import { PersonSchema, PersonSchemaProps } from '@/seo/person.schema'
import { Badge } from '@/components/shared/elements/badge'
import { Button } from '@/components/shared/elements/button'
import { Separator } from '@/components/shared/elements/separator'
import Link from 'next/link'
import { alumniPayload, infoPayload } from '@/_temp/information.temp'
import { getServerDomain } from '@/lib/domain.parser'

const personSchema: PersonSchemaProps = {
  name: infoPayload.name,
  jobTitle: infoPayload.job,
  description: infoPayload.summary,
  familyName: infoPayload.last_name,
  givenName: infoPayload.first_name,
  brand: infoPayload.brand,
  gender: infoPayload.gender,
  sameAs: infoPayload.url_github,
  url: infoPayload.url,
  telephone: infoPayload.telephone,
  nationality: infoPayload.nationality,
  email: infoPayload.email,
  knowsAbout: infoPayload.knows_about,
  skills: infoPayload.skills,
  image: infoPayload.image,
  hasOccupation: infoPayload.occupation,
  address: {
    postalCode: infoPayload.address.postal_code,
    addressRegion: infoPayload.address.region,
    addressLocality: infoPayload.address.locality
  },
  alumni: alumniPayload
}

export default async function Home () {
  const domain = await getServerDomain()
  return (
    <>
      <PersonSchema {...personSchema} />
      <div className='container mx-auto max-w-prose space-y-16 min-h-svh'>
        <header
          id='headline'
          aria-label='Professional Overview'
          className='grid place-content-center text-center min-h-[50dvh] sm:min-h-[60dvh] gap-1 sm:gap-2'
        >
          <Badge variant='secondary' className='text-xs mb-1 mx-auto'>
            {infoPayload.job}
          </Badge>
          <h1 className='font-semibold text-2xl sm:text-5xl text-forest-green-700'>
            {infoPayload.name}
          </h1>
          <article id='summary' className='px-4 text-center mx-auto'>
            <p className='leading-relaxed text-sm text-neutral-400 max-w-[40ch]'>
              {infoPayload.headline_short}
            </p>
          </article>
          <div className='mx-auto mt-4 flex gap-2 items-center flex-wrap'>
            <Button className='w-fit ' asChild>
              <Link href='/availability'>
                Open for work <Icons.IconArrowRight />
              </Link>
            </Button>
            <Button variant='outline' className='w-fit ' asChild>
              <Link
                href={`${domain}/resume`}
                target='_blank'
                rel='noopener noreferrer'
              >
                Resume <Icons.IconFileDownload />
              </Link>
            </Button>
          </div>
        </header>
        <div id='highlights' className='flex flex-col sm:flex-row gap-4'>
          {infoPayload.highlights.map(highlight => (
            <div
              key={highlight.title}
              className='p-4 rounded-2xl border border-dashed border-neutral-300 group flex-1 hover:bg-forest-green-100/20 backdrop-blur-lg max-w-3xs mx-auto grid place-content-center hover:border-forest-green-700 min-h-[84px]'
            >
              <p className='text-xs text-forest-green-600/80 group-hover:text-forest-green-700 text-center'>
                {highlight.description}
              </p>
            </div>
          ))}
        </div>
        <Separator />
        <CoreCompetencies
          label={infoPayload.competencies_label}
          competencies={infoPayload.competencies}
        />
        <div className='grid place-content-center'>
          <Button asChild>
            <Link href='/portfolio'>
              Check Portfolio <Icons.IconArrowRight />
            </Link>
          </Button>
        </div>
        <Separator />
        <section id='social__information' className='grid'>
          <Badge variant='secondary' className='text-xs mb-6 mx-auto'>
            {infoPayload.social_information_label}
          </Badge>
          <div className='grid sm:grid-cols-2 gap-3'>
            {infoPayload.social_information.map(social => (
              <SocialCard
                key={social.id}
                icon={Icons[social.icon_name as keyof typeof Icons]}
                title={social.label}
                label={social.name}
                description={social.description}
                id={`card__${social.id}`}
              />
            ))}
          </div>
        </section>
        <div className='grid place-content-center'>
          <Button asChild>
            <Link href='/contact'>
              Get in touch <Icons.IconArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </>
  )
}
