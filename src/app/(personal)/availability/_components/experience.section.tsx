import React from 'react'
import dayjs from 'dayjs'
import { Separator } from '@/components/shared/elements/separator'
import { IconSquareRoundedFilled } from '@tabler/icons-react'
type Experience = {
  id: string
  job_title: string
  job_description?: string | null
  job_type?: string | null
  job_details?: string | string[] | null
  job_location?: string | null
  employeer?: string | null
  start_date: string
  end_date?: string | null
}

type ExperienceSectionProps = {
  label: string
  experiences: Experience[]
}

const parseDateToYear = (date: string) => {
  return dayjs(date).year()
}

const parseMonthCounter = (startDate: string, endDate?: string) => {
  if (!endDate) return dayjs().diff(startDate, 'month')
  return dayjs(endDate).diff(startDate, 'month')
}

const ExperienceSection = ({ label, experiences }: ExperienceSectionProps) => {
  return (
    <div className='container max-w-prose mx-auto my-4 bg-white p-4 rounded-2xl transition-all'>
      <h3 className='text-forest-green-800 mb-2 font-medium text-sm'>
        {label}
      </h3>
      <div>
        {experiences.map(experience => {
          const endDateParser = !experience?.end_date
            ? '- Present'
            : parseDateToYear(experience.start_date) ===
              parseDateToYear(experience.end_date)
            ? null
            : `- ${parseDateToYear(experience.end_date)}`

          const durationParser = parseMonthCounter(
            experience.start_date,
            experience.end_date
          )
          return (
            <React.Fragment key={experience.id}>
              <div className='flex gap-0 sm:gap-4 my-3 flex-col sm:flex-row'>
                <div className='min-w-[12ch] max-w-[24ch] text-neutral-500 text-start sm:text-end text-wrap'>
                  <span>{parseDateToYear(experience.start_date)} </span>
                  {!!endDateParser && <span>{endDateParser} </span>}
                  {!!durationParser && (
                    <span className='whitespace-nowrap'>
                      ({`${durationParser} months`})
                    </span>
                  )}
                </div>
                <div>
                  <h2 className='font-bold text-forest-green-800'>
                    {experience.job_title}
                  </h2>
                  <p className='text-forest-green-600'>
                    {experience.employeer}
                    {!!experience?.job_type && (
                      <span> [{experience.job_type}]</span>
                    )}
                  </p>
                  {!!experience?.job_location && (
                    <p className='text-neutral-500'>
                      {experience.job_location}
                    </p>
                  )}
                  {!!experience?.job_details && (
                    <div className='px-1 py-2 text-foreground/80'>
                      {Array.isArray(experience.job_details) ? (
                        <ul>
                          {experience.job_details.map((detail, index) => (
                            <li
                              className='leading-relaxed space-x-3 rtl:space-x-reverse'
                              key={`job_detail_${index}`}
                            >
                              <IconSquareRoundedFilled className='inline-flex stroke-1 size-2.5 mr-2 text-forest-green-600' />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>{experience?.job_details}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <Separator className='last:hidden my-0.5' />
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

export default ExperienceSection
