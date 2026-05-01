import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyEmailRequest } from '../../shared/api/auth'
import { getErrorMessage } from '../../shared/api/client'
import { Button } from '../../shared/components/button'
import { AuthCard } from './auth-card'

type VerifyState = 'loading' | 'success' | 'error'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<VerifyState>('loading')
  const [message, setMessage] = useState('Confirming your email...')
  const hasTriggered = useRef(false)

  useEffect(() => {
    if (hasTriggered.current) {
      return
    }

    hasTriggered.current = true

    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('Verification token is missing.')
      return
    }

    void verifyEmailRequest(token)
      .then(({ data }) => {
        setStatus('success')
        setMessage(data.message)
      })
      .catch((error) => {
        setStatus('error')
        setMessage(getErrorMessage(error))
      })
  }, [searchParams])

  return (
    <AuthCard
      eyebrow="Email verification"
      title={status === 'success' ? 'Email confirmed' : status === 'error' ? 'Verification failed' : 'Checking your link'}
      description={message}
      footer={
        status === 'success' ? (
          <>
            Ready to continue?{' '}
            <Link to="/login" className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4">
              Sign in
            </Link>
          </>
        ) : (
          <>
            Need another link?{' '}
            <Link to="/check-email" className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4">
              Request a new one
            </Link>
          </>
        )
      }
    >
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
        {status === 'loading' ? 'Please wait while we validate your confirmation link.' : message}
      </div>

      <div className="mt-5">
        {status === 'success' ? (
          <Link to="/login">
            <Button className="w-full py-3">Go to sign in</Button>
          </Link>
        ) : status === 'error' ? (
          <Link to="/check-email">
            <Button className="w-full py-3">Request another email</Button>
          </Link>
        ) : null}
      </div>
    </AuthCard>
  )
}
