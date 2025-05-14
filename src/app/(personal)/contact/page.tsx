import React from 'react'
import { Button } from '@/components/shared/elements/button'
import { Input } from '@/components/shared/elements/input'
import { Textarea } from '@/components/shared/elements/textarea'
import { Label } from '@/components/shared/elements/label'
import { Badge } from '@/components/shared/elements/badge'

const ContactPage = () => {
  const info = {
    tag: 'Contact',
    headline: "Let's Connect",
    description:
      "I welcome the opportunity to connect with you. Please don't hesitate to reach out through this form for any inquiries or collaborations.",
    disclaimer:
      'Your personal information will be securely encrypted and temporarily stored in our protected database. The data will be automatically purged after processing your contact request and sending an email confirmation. We are committed to protecting your privacy and maintain strict data retention policies that ensure your information is not kept longer than necessary.'
  }
  return (
    <div className='container max-w-prose mx-auto'>
      <div className='min-h-[20dvh] grid items-center my-6'>
        <div>
          <Badge variant='secondary' className='text-xs mb-1 mx-auto'>
            {info.tag}
          </Badge>
          <h2 className='text-forest-green-700 font-bold text-4xl'>
            {info.headline}
          </h2>
          <p className='text-neutral-500 max-w-[50ch]'>{info.description}</p>
        </div>
      </div>
      <form action='' className='flex flex-col gap-3'>
        <div className='space-y-1'>
          <Label htmlFor='name'>Name</Label>
          <Input id='name' placeholder='(e.g. Juan Dela Cruz)' />
        </div>
        <div className='space-y-1'>
          <Label htmlFor='contact'>Email / Phone number</Label>
          <Input id='contact' placeholder='(e.g. juan_delacruz01@domain.com)' />
        </div>
        <div className='space-y-1'>
          <Label htmlFor='message'>Message</Label>
          <Textarea id='message' placeholder='Message' />
        </div>
        <div className='rounded-2xl p-4 text-sm border border-dashed border-forest-green-300'>
          <p className='leading-relaxed text-xs text-neutral-500'>
            <strong className='text-forest-green-700'>Privacy Notice: </strong>
            {info.disclaimer}
          </p>
        </div>
        <div className='flex justify-end'>
          <Button disabled>Submit</Button>
        </div>
      </form>
    </div>
  )
}

export default ContactPage
