import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyEmailRequest } from '../../shared/api/auth'
import { getErrorMessage } from '../../shared/api/client'
import { AuthCard } from './auth-card'

type State = 'verifying' | 'success' | 'error'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [state, setState] = useState<State>('verifying')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const called = useRef(false)

  useEffect(() => {
    if (called.current || !token) {
      if (!token) {
        setState('error')
        setErrorMsg('No verification token found in the URL.')
      }
      return
    }
    called.current = true

    verifyEmailRequest(token)
      .then(() => setState('success'))
      .catch((err) => {
        setState('error')
        setErrorMsg(getErrorMessage(err))
      })
  }, [token])

  if (state === 'verifying') {
    return (
      <AuthCard eyebrow="UniShare" title="Verifying email" description="Please wait while we confirm your address.">
        <div className="flex justify-center py-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
        </div>
      </AuthCard>
    )
  }

  if (state === 'success') {
    return (
      <AuthCard
        eyebrow="UniShare"
        title="Email verified"
        description="Your email address has been confirmed. You can now sign in."
        footer={
          <Link to="/login" className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4">
            Sign in
          </Link>
        }
      >
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Verification successful.
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      eyebrow="UniShare"
      title="Verification failed"
      description="This link may have expired or already been used."
      footer={
        <Link to="/check-email" className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4">
          Resend verification email
        </Link>
      }
    >
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {errorMsg ?? 'Verification failed. Please request a new link.'}
      </div>
    </AuthCard>
  )
}
