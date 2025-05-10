import { createClient } from '@/utils/supabase/server'
import OneTapComponent from './_components/OneTapUI'
import { login, signup } from './actions'

async function handleSignInWithGoogle (response) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  })
}

export default function LoginPage () {
  return (
    <form className='flex flex-col max-w-sm mx-auto my-20 bg-amber-50 p-6 rounded-lg'>
      <label htmlFor='email'>Email:</label>
      <input id='email' name='email' type='email' required />
      <label htmlFor='password'>Password:</label>
      <input id='password' name='password' type='password' required />
      <button formAction={login}>Log in</button>
      <button formAction={signup}>Sign up</button>
      <OneTapComponent />
    </form>
  )
}
