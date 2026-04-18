import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../../features/auth/use-auth'
import { getErrorMessage } from '../../shared/api/client'
import { Button } from '../../shared/components/button'
import { AuthCard } from './auth-card'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)

    try {
      await login(values)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  })

  return (
    <AuthCard
      eyebrow="Welcome to UniShare"
      title="Sign in"
      description="Sign in with your student account to access the secure campus rental marketplace."
      footer={
        <>
          No account yet?{' '}
          <Link to="/register" className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4">
            Create one
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Username</span>
          <input
            {...register('username')}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
            placeholder="student123"
          />
          {errors.username ? <span className="mt-2 block text-sm text-rose-600">{errors.username.message}</span> : null}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
          <input
            {...register('password')}
            type="password"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
            placeholder="Enter your password"
          />
          {errors.password ? <span className="mt-2 block text-sm text-rose-600">{errors.password.message}</span> : null}
        </label>

        <div className="flex items-center justify-between gap-3 text-sm">
          <Link
            to="/forgot-password"
            className="font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-950"
          >
            Forgot password?
          </Link>
          <Link
            to="/check-email"
            className="font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-950"
          >
            Resend confirmation
          </Link>
        </div>

        {submitError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        ) : null}

        <Button type="submit" loading={isSubmitting} className="w-full py-3">
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </AuthCard>
  )
}
