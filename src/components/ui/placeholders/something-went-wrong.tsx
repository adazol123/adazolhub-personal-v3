import React from 'react'

type SomethingWentWrongProps = {
  status?: string | number
  message?: string
  title?: string
  reason?: unknown
  source?: string
}

const SomethingWentWrong = ({
  status = 500,
  title = 'Something went wrong',
  message,
  reason,
  source
}: SomethingWentWrongProps) => {
  return (
    <div className='container grid place-content-center min-h-[100svh] mx-auto'>
      <div className='bg-neutral-50 p-6 rounded-2xl'>
        <div className='mb-4'>
          <h1 className='font-bold text-2xl'>{title}</h1>
          <span className='text-muted-foreground'>Status {String(status)}</span>
        </div>
        <div className=''>
          {reason && !message ? (
            <>
              <h3 className='text-sm'>Reason:</h3>
              <pre className='p-2 bg-neutral-100 rounded-lg text-rose-400 text-sm'>
                {JSON.stringify(reason, null, 2)}
              </pre>
            </>
          ) : (
            <pre>{message}</pre>
          )}
        </div>
        {!!source && (
          <span className='text-xs text-neutral-300'>Source: {source}</span>
        )}
      </div>
    </div>
  )
}

export default SomethingWentWrong
