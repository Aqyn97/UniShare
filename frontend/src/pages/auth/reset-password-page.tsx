import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { resetPasswordRequest } from '../../shared/api/auth'
import { getErrorMessage } from '../../shared/api/client'
import { Button } from '../../shared/components/button'
import { AuthCard } from './auth-card'

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)

    try {
      const { data } = await resetPasswordRequest({
        token,
        password: values.password,
      })
      setSuccessMessage(data.message)
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  })

  if (!token) {
    return (
      <AuthCard
        eyebrow="Password recovery"
        title="Reset link is missing"
        description="Open the password reset page from the email we sent you. The link must include a token."
        footer={
          <>
            Need a new link?{' '}
            <Link to="/forgot-password" className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4">
              Request another reset email
            </Link>
          </>
        }
      >
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Password reset token is missing.
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      eyebrow="Password recovery"
      title="Create a new password"
      description="Choose a new password for your UniShare account. The reset link can be used only once."
      footer={
        successMessage ? (
          <>
            Password changed successfully.{' '}
            <Link to="/login" className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4">
              Sign in
            </Link>
          </>
        ) : (
          <>
            Need another link?{' '}
            <Link to="/forgot-password" className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4">
              Request it again
            </Link>
          </>
        )
      }
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">New password</span>
          <input
            {...register('password')}
            type="password"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
            placeholder="Create a new password"
          />
          {errors.password ? <span className="mt-2 block text-sm text-rose-600">{errors.password.message}</span> : null}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Confirm password</span>
          <input
            {...register('confirmPassword')}
            type="password"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
            placeholder="Repeat the new password"
          />
          {errors.confirmPassword ? (
            <span className="mt-2 block text-sm text-rose-600">{errors.confirmPassword.message}</span>
          ) : null}
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
          {isSubmitting ? 'Updating password...' : 'Update password'}
        </Button>
      </form>
    </AuthCard>
  )
}
