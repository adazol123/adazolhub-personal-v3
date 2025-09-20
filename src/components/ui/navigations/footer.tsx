import React, { createElement } from 'react'
import * as Icons from '@tabler/icons-react'
import Link from 'next/link'
import { Separator } from '@/components/shared/elements/separator'
import { footerPayload } from '@/_temp/information.temp'

const footerInfo = footerPayload

const sitemaps = [
  {
    label: 'Home',
    path: '/'
  },
  {
    label: 'Availability (Open for work)',
    path: '/availability'
  },
  {
    label: 'Resume',
    path: '/resume'
  },
  {
    label: 'Portfolio',
    path: '/portfolio'
  },
  {
    label: 'Testimonial',
    path: '/testimonial'
  },
  {
    label: 'Thread',
    path: '/thread'
  },
  {
    label: 'Get in touch (Contact)',
    path: '/contact'
  },

  {
    label: 'About',
    path: '/about'
  }
]

const Footer = () => {
  return (
    <div className='my-12 container mx-auto max-w-prose flex flex-col gap-16 pb-4'>
      <Separator />
      <div id='footer__description'>
        <h2 className='font-medium text-lg'>{footerInfo.header}</h2>
        {footerInfo.description.map((parag, index) => (
          <p key={index} className='text-sm text-neutral-500 my-3'>
            {parag}
          </p>
        ))}
      </div>
      <div id='footer__analytics' className='flex flex-col gap-4'>
        <div>
          <h3 className='text-xs text-neutral-400'>
            {footerInfo.analytics.page_visit_label}
          </h3>
          <span>{footerInfo.analytics.page_visit_value}</span>
        </div>
        <div>
          <h3 className='text-xs text-neutral-400'>
            {footerInfo.analytics.status_label}
          </h3>
          <span>{footerInfo.analytics.status_value}</span>
        </div>
        <div>
          <h3 className='text-xs text-neutral-400'>
            {footerInfo.analytics.last_update_label}
          </h3>
          <span>{footerInfo.analytics.last_update_value}</span>
        </div>
      </div>
      <div id='footer__contact'>
        <h3 className='text-xs text-neutral-400'>
          {footerInfo.contacts_label}
        </h3>
        <div className='flex flex-col gap-3 my-4'>
          {footerInfo.contacts.map(contact => (
            <div key={contact.type} className='flex gap-1 items-center'>
              {Icons[contact.icon_name as keyof typeof Icons] && (
                <div className='p-1.5 bg-forest-green-600 rounded-2xl'>
                  {createElement(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    Icons[contact.icon_name as keyof typeof Icons] as any,
                    {
                      className: 'size-3 text-forest-green-50'
                    }
                  )}
                </div>
              )}
              <span className='text-sm'>{contact.value}</span>
            </div>
          ))}
        </div>
      </div>
      <Separator />
      <div id='footer__sitemaps'>
        <h3 className='text-xs text-neutral-400'>Sitemaps</h3>
        <ul className='flex flex-col gap-3 text-sm text-neutral-600 mt-4'>
          {sitemaps.map(other => (
            <Link
              key={other.label}
              href={other.path}
              className='hover:underline hover:text-forest-green-400 text-forest-green-500 flex items-center gap-1'
            >
              <Icons.IconArrowUpRight className='stroke-1 size-3' />
              {other.label}
            </Link>
          ))}
        </ul>
      </div>
      <div id='footer__rights' className='grid place-content-center mb-4'>
        <div className='flex gap-3 items-center justify-center text-forest-green-700/80 py-3'>
          <Icons.IconBrandLinkedin />
          <Icons.IconBrandGithub />
          <Icons.IconBrandFacebook />
          <Icons.IconBrandInstagram />
        </div>
        <div>
          <span className='text-xs opacity-50 font-light inline-flex items-center gap-0.5'>
            {footerInfo.rights}
            <Icons.IconAt className='size-[0.7rem] stroke-1 p-0' />
            {footerInfo.year}
          </span>
        </div>
      </div>
    </div>
  )
}

export default Footer
