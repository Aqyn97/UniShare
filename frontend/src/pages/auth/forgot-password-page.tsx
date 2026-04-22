import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { forgotPasswordRequest } from '../../shared/api/auth'
import { getErrorMessage } from '../../shared/api/client'
import { Button } from '../../shared/components/button'
import { AuthCard } from './auth-card'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})

type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      await forgotPasswordRequest(values)
      setSuccess(true)
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  })

  if (success) {
    return (
      <AuthCard
        eyebrow="UniShare"
        title="Check your email"
        description="If an account exists for that address, you'll receive a password reset link shortly."
        footer={
          <Link to="/login" className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4">
            Back to sign in
          </Link>
        }
      >
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Reset email sent. Check your inbox.
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      eyebrow="UniShare"
      title="Forgot password"
      description="Enter your email and we'll send you a link to reset your password."
      footer={
        <>
          Remember it?{' '}
          <Link to="/login" className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
          <input
            {...register('email')}
            type="email"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
            placeholder="student@university.edu"
          />
          {errors.email ? <span className="mt-2 block text-sm text-rose-600">{errors.email.message}</span> : null}
        </label>

        {submitError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        ) : null}

        <Button type="submit" loading={isSubmitting} className="w-full py-3">
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>
    </AuthCard>
  )
}
