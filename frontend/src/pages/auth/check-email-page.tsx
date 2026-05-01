import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { resendVerificationRequest } from '../../shared/api/auth'
import { getErrorMessage } from '../../shared/api/client'
import { Button } from '../../shared/components/button'
import { AuthCard } from './auth-card'

const emailSchema = z.object({
  email: z.string().email('Enter a valid email'),
})

type EmailFormData = z.infer<typeof emailSchema>

export function CheckEmailPage() {
  const [searchParams] = useSearchParams()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: searchParams.get('email') ?? '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)

    try {
      const { data } = await resendVerificationRequest(values)
      setSuccessMessage(data.message)
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  })

  return (
    <AuthCard
      eyebrow="One more step"
      title="Confirm your email"
      description="We sent a confirmation link to your inbox. Open it before trying to sign in. If the email did not arrive, request another one below."
      footer={
        <>
          Already confirmed it?{' '}
          <Link to="/login" className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4">
            Go to sign in
          </Link>
        </>
      }
    >
      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
        <p className="font-medium text-slate-900">What happens next</p>
        <p className="mt-2">1. Open the email from UniShare.</p>
        <p className="mt-1">2. Click the confirmation link.</p>
        <p className="mt-1">3. Return here and sign in.</p>
      </div>

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

        {successMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        {submitError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        ) : null}

        <Button type="submit" loading={isSubmitting} className="w-full py-3">
          {isSubmitting ? 'Sending link...' : 'Resend confirmation email'}
        </Button>
      </form>
    </AuthCard>
  )
}
