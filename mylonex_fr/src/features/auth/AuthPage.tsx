import { useState, type FormEvent } from 'react'
import { acceptBuyerSignup, signIn } from '../../shared/session/auth'
import AccountCard from '../../shared/components/AccountCard'
import { paths, replaceRoute } from '../../routes'
import { registerBuyer, type SignupInput } from './buyer-api'

async function signUp(input: SignupInput) {
  const result = await registerBuyer(input)
  return result.status === 'confirmation_required' ? null :
    acceptBuyerSignup(result.accessToken, result.refreshToken)
}

const fields = [
  { name: 'fullName', label: 'Full name', autoComplete: 'name', maxLength: 200 },
  { name: 'company', label: 'Company name', autoComplete: 'organization', maxLength: 200 },
  { name: 'phone', label: 'Phone number', autoComplete: 'tel', type: 'tel', maxLength: 50 },
  { name: 'gstNumber', label: 'GST number (optional)', maxLength: 50 },
]
const terms = import.meta.env.VITE_TERMS_URL || 'https://www.mylonex.com/terms-and-conditions'
const privacy = import.meta.env.VITE_PRIVACY_URL || 'https://www.mylonex.com/privacy-policy'

export default function AuthPage({ signupPage, initialError }: { signupPage: boolean; initialError: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(initialError)
  const [waiting, setWaiting] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const value = (name: string) => String(values.get(name) ?? '')
    setError('')
    setBusy(true)
    try {
      const email = value('email').trim()
      const result = signupPage ? await signUp({
        email, password: value('password'), fullName: value('fullName').trim(), company: value('company').trim(),
        phone: value('phone').trim(), gstNumber: value('gstNumber').trim(), agreedToTerms: values.has('agreedToTerms'),
      }) : await signIn(email, value('password'))
      if (result) {
        replaceRoute(paths.dashboards[result.role])
      } else setWaiting(email)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AccountCard busy={busy} error={error}>
      {waiting ? (
            <>
              <h1>Check your email</h1>
              <p role="status">If confirmation is needed for <strong>{waiting}</strong>, follow the link in your inbox. If you already have an account, you can sign in.</p>
              <a href={paths.login}>Go to sign in</a>
            </>
          ) : (
            <>
              <h1>{signupPage ? 'Create your buyer account' : 'Sign in to MyloNex'}</h1>
              <p>{signupPage ? 'Join the MyloNex textile marketplace.' : 'Access your MyloNex account.'}</p>
              <form method="post" onSubmit={submit}>
                <fieldset disabled={busy}>
                  {signupPage && <div className="grid gap-4 sm:grid-cols-2">
                    {fields.map(({ label, name, ...props }, index) => (
                      <label key={name} className={index < 2 ? 'sm:col-span-2' : undefined}>
                        {label}<input className="input" name={name} required={name !== 'gstNumber'} {...props} />
                      </label>
                    ))}
                  </div>}
                  <label>{signupPage ? 'Company email address' : 'Email address'}
                    <input className="input" name="email" type="email" autoComplete="email" required maxLength={254} />
                  </label>
                  <label>Password
                    <input className="input" name="password" type="password" autoComplete={signupPage ? 'new-password' : 'current-password'}
                      required minLength={signupPage ? 6 : undefined} maxLength={1024} />
                  </label>
                  {signupPage && <label className="consent">
                    <input name="agreedToTerms" type="checkbox" required />
                    <span>I agree to the <a href={terms} target="_blank" rel="noreferrer">Terms &amp; Conditions</a> and <a href={privacy} target="_blank" rel="noreferrer">Privacy Policy</a>.</span>
                  </label>}
                  <button className="btn-primary" type="submit">{signupPage ? busy ? 'Creating account…' : 'Create account' : busy ? 'Signing in…' : 'Sign in'}</button>
                </fieldset>
              </form>
              <p className="switch">{signupPage ? 'Already registered? ' : 'New to MyloNex? '}
                <a href={signupPage ? paths.login : paths.signup}>{signupPage ? 'Sign in' : 'Create a buyer account'}</a>
              </p>
            </>
          )}
    </AccountCard>
  )
}
