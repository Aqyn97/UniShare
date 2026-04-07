import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../../features/auth/use-auth'
import { getErrorMessage } from '../../shared/api/client'

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
    <section className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-8">
        <p className="text-sm font-medium text-slate-500">Welcome to UniShare</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Sign in</h1>
        <p className="mt-3 text-sm text-slate-600">
          Sign in with your student account to access the secure campus rental marketplace.
        </p>
      </div>

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

        {submitError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        No account yet?{' '}
        <Link to="/register" className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4">
          Create one
        </Link>
      </p>
    </section>
  )
}
