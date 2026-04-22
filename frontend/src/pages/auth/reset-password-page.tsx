import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { resetPasswordRequest } from '../../shared/api/auth'
import { getErrorMessage } from '../../shared/api/client'
import { Button } from '../../shared/components/button'
import { AuthCard } from './auth-card'

const schema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match',
  })

type FormData = z.infer<typeof schema>

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    if (!token) {
      setSubmitError('Invalid or missing reset token. Request a new reset link.')
      return
    }
    try {
      await resetPasswordRequest({ token, password: values.password })
      navigate('/login', { replace: true })
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  })

  if (!token) {
    return (
      <AuthCard
        eyebrow="UniShare"
        title="Invalid link"
        description="This password reset link is invalid or has expired."
        footer={
          <Link to="/forgot-password" className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4">
            Request a new link
          </Link>
        }
      >
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          No reset token found in the URL.
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      eyebrow="UniShare"
      title="Set new password"
      description="Choose a strong password for your account."
      footer={
        <Link to="/login" className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">New password</span>
          <input
            {...register('password')}
            type="password"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
            placeholder="At least 6 characters"
          />
          {errors.password ? <span className="mt-2 block text-sm text-rose-600">{errors.password.message}</span> : null}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Confirm password</span>
          <input
            {...register('confirm')}
            type="password"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
            placeholder="Repeat your password"
          />
          {errors.confirm ? <span className="mt-2 block text-sm text-rose-600">{errors.confirm.message}</span> : null}
        </label>

        {submitError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        ) : null}

        <Button type="submit" loading={isSubmitting} className="w-full py-3">
          {isSubmitting ? 'Saving...' : 'Set new password'}
        </Button>
      </form>
    </AuthCard>
  )
}
