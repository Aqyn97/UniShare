import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { forgotPasswordRequest } from '../../shared/api/auth'
import { getErrorMessage } from '../../shared/api/client'
import { Button } from '../../shared/components/button'
import { AuthCard } from './auth-card'

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordPage() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)

    try {
      const { data } = await forgotPasswordRequest(values)
      setSuccessMessage(data.message)
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  })

  return (
    <AuthCard
      eyebrow="Password recovery"
      title="Reset your password"
      description="Enter the email connected to your UniShare account. If it exists, we will send a secure reset link."
      footer={
        <>
          Remembered your password?{' '}
          <Link to="/login" className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4">
            Back to sign in
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
          {isSubmitting ? 'Sending reset link...' : 'Send reset link'}
        </Button>
      </form>
    </AuthCard>
  )
}
