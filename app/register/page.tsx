'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowUpRight, AlertCircle, Loader2, MailCheck } from 'lucide-react';
import { passwordSchema } from '@/lib/policies';
import AuthShell from '@/components/AuthShell';
import PasswordField from '@/components/PasswordField';
const schema = z.object({
    email: z.string().trim().max(254).email('Enter a valid email address.'),
    password: passwordSchema,
    confirmPassword: z.string(),
}).refine(values => values.password === values.confirmPassword, {
    message: 'Passwords do not match.', path: ['confirmPassword'],
});
type Values = z.infer<typeof schema>;
export default function RegisterPage() {
    const [message, setMessage] = useState('');
    const [complete, setComplete] = useState<string | null>(null);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });
    async function submit(values: Values) {
        setMessage('');
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: values.email, password: values.password }),
            });
            const data = await response.json();
            if (!response.ok) {
                setMessage(data.error || 'Account creation failed.');
                return;
            }
            setComplete(values.email.trim());
        }
        catch {
            setMessage('Unable to connect. Please try again.');
        }
    }
    return (<AuthShell eyebrow="YOUR NEXT BIG IDEA STARTS HERE" title={<>A curious mind.<br />An open future.<br /><em>Your YANTRA AI journey.</em></>} intro="Create your account, find your collaborators and get ready to build with artificial intelligence." steps={['Create an account & verify your email', 'Complete your profile & form a team', 'Accept official rules & submit registration']}>
      {complete ? (<div className="auth-success" role="status">
          <span className="auth-success-icon"><MailCheck size={30} /></span>
          <h2>Check your inbox.</h2>
          <p>We sent a verification link to <strong>{complete}</strong>. Open it to confirm your address, then sign in to complete your profile.</p>
          <p className="auth-fine">Can’t find it? Check spam or promotions. You can resend it later from Account settings.</p>
          <Link className="auth-submit" href="/login">Continue to sign in <ArrowUpRight size={18} /></Link>
        </div>) : (<>
          <div className="auth-head">
            <p className="eyebrow">JOIN THE BUILDERS</p>
            <h2>Create your account</h2>
            <p>Already here? <Link href="/login">Sign in</Link></p>
          </div>
          {message && <div className="auth-alert" role="alert"><AlertCircle size={17} /><span>{message}</span></div>}
          <form onSubmit={handleSubmit(submit)} className="auth-form" noValidate>
            <div className="auth-field">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" autoComplete="email" placeholder="you@college.edu" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} {...register('email')} />
              {errors.email && <p id="email-error" role="alert" className="auth-error-text">{errors.email.message}</p>}
            </div>
            <PasswordField id="password" label="Password" autoComplete="new-password" meter placeholder="12–72 characters" error={errors.password?.message} {...register('password')} />
            <PasswordField id="confirm-password" label="Confirm password" autoComplete="new-password" placeholder="Re-enter your password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
            <button disabled={isSubmitting} className="auth-submit">{isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Creating account…</> : <>Create account <ArrowUpRight size={18} /></>}</button>
          </form>
          <p className="auth-fine">An account is the first step. Event registration requires a verified email, a completed profile and acceptance of the published rules. <Link href="/privacy">Read the privacy notice.</Link></p>
        </>)}
    </AuthShell>);
}
