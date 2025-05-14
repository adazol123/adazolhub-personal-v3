import React from 'react'
import HeadingSection from './_components/heading'
import SummarySection from './_components/summary'
import ExpertiseSection from './_components/expertise.section'
import { availabilityPayload, infoPayload } from '@/_temp/information.temp'
import {
  IconBrandAws,
  IconBrandTypescript,
  IconCodeDots,
  IconMoodCheck,
  IconServerBolt,
  IconUsersGroup
} from '@tabler/icons-react'
import ExperienceSection from './_components/experience.section'

const IconsExpertisesMapper = [
  IconCodeDots,
  IconBrandTypescript,
  IconServerBolt,
  IconBrandAws,
  IconMoodCheck,
  IconUsersGroup
]

const ResumePage = () => {
  return (
    <>
      <HeadingSection />
      <SummarySection
        label={infoPayload.summary_label}
        summary={infoPayload.summary}
      />
      <ExpertiseSection
        label={availabilityPayload.expertise_label}
        expertises={availabilityPayload.expertise.map((expertise, index) => ({
          ...expertise,
          icons: IconsExpertisesMapper[index]
        }))}
      />
      <ExperienceSection
        label={availabilityPayload.experience_label}
        experiences={availabilityPayload.experience}
      />
    </>
  )
}

export default ResumePage
