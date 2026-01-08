'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Mail, KeyRound } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { changePassword, resetPassword, confirmReset } from '@/lib/auth-utils';
import { useAuth } from '@/context/auth-context';
import Image from 'next/image';
import Link from 'next/link';

export default function ResetPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [step, setStep] = useState<'request' | 'reset'>('request');
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const oobCode = searchParams.get('oobCode');

    useEffect(() => {
        if (oobCode) {
            setStep('reset');
        } else if (user) {
            setStep('reset');
        } else {
            setStep('request');
        }
    }, [oobCode, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        setIsLoading(true);
        try {
            if (step === 'request') {
                if (!email) throw new Error('Please enter your email address.');
                await resetPassword(email.trim().toLowerCase());
                setSuccess(true);
            } else {
                // Reset/Change step
                if (password.length < 6) throw new Error('Password must be at least 6 characters.');
                if (password !== confirmPassword) throw new Error('Passwords do not match.');

                if (oobCode) {
                    // Scenario: Forgot Password flow (via Email)
                    await confirmReset(oobCode, password);
                } else if (user) {
                    // Scenario: Change Password flow (Logged in)
                    await changePassword(password);
                } else {
                    throw new Error('Missing verification code or active session.');
                }

                // Update in Supabase via API
                // We use searchParams 'email' if available from Firebase return URL, or user.email, or manual input
                // Note: Firebase reset links often include the email or UID encoded, but we'll try to match by current state
                const response = await fetch('/api/user/update-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        uid: user?.uid || null,
                        email: !user ? email.trim().toLowerCase() : null,
                        password: password,
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to sync password to database');
                }

                setSuccess(true);
                setTimeout(() => {
                    router.push(user ? '/dashboard' : '/login');
                }, 2500);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="inline-flex h-20 w-20 items-center justify-center mb-6 bg-indigo-500/10 rounded-3xl border border-indigo-500/20 shadow-inner"
                        >
                            {step === 'request' ? (
                                <Mail className="h-10 w-10 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
                            ) : (
                                <ShieldCheck className="h-10 w-10 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
                            )}
                        </motion.div>
                        <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
                            {step === 'request' ? 'Recover Account' : 'Security Shield'}
                        </h2>
                        {user ? (
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-300 text-sm mb-2">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                {user.email}
                            </div>
                        ) : (
                            <p className="text-slate-400 px-4">
                                {step === 'request'
                                    ? "We'll send a secure link to reset your password"
                                    : "Set a strong new password for your account"}
                            </p>
                        )}
                    </div>

                    {!success ? (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-center gap-3"
                                >
                                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                    {error}
                                </motion.div>
                            )}

                            {step === 'request' ? (
                                <div className="space-y-2">
                                    <Label className="text-slate-300 ml-1 flex items-center gap-2">
                                        <Mail className="h-3 w-3" /> Email Address
                                    </Label>
                                    <Input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@example.com"
                                        className="h-14 bg-white/5 border-white/10 text-white rounded-2xl focus:ring-2 focus:ring-indigo-500/40 transition-all text-lg pl-6"
                                    />
                                </div>
                            ) : (
                                <>
                                    {!user && !oobCode && (
                                        <div className="space-y-2">
                                            <Label className="text-slate-300 ml-1 flex items-center gap-2">
                                                <Mail className="h-3 w-3" /> Email Address
                                            </Label>
                                            <Input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Enter your registered email"
                                                className="h-14 bg-white/5 border-white/10 text-white rounded-2xl focus:ring-2 focus:ring-indigo-500/40 transition-all text-lg pl-6"
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <Label className="text-slate-300 ml-1 flex items-center gap-2">
                                            <Lock className="h-3 w-3" /> New Password
                                        </Label>
                                        <Input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Min. 6 characters"
                                            className="h-14 bg-white/5 border-white/10 text-white rounded-2xl focus:ring-2 focus:ring-indigo-500/40 transition-all text-lg pl-6"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300 ml-1 flex items-center gap-2">
                                            <ShieldCheck className="h-3 w-3" /> Confirm Password
                                        </Label>
                                        <Input
                                            type="password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Repeat new password"
                                            className="h-14 bg-white/5 border-white/10 text-white rounded-2xl focus:ring-2 focus:ring-indigo-500/40 transition-all text-lg pl-6"
                                        />
                                    </div>
                                </>
                            )}

                            <Button
                                disabled={isLoading}
                                className="w-full h-14 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 group text-lg"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </div>
                                ) : (
                                    <>
                                        {step === 'request' ? 'Send Reset Link' : 'Update Password'}
                                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </form>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-8 space-y-4"
                        >
                            <div className="inline-flex h-20 w-20 items-center justify-center bg-emerald-500/10 rounded-full mb-4">
                                <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">
                                {step === 'request' ? 'Mail Sent!' : 'Password Updated!'}
                            </h3>
                            <p className="text-slate-400">
                                {step === 'request'
                                    ? `We've sent a recovery link to ${email}. Please check your inbox and click the link to continue.`
                                    : 'Your account security has been updated successfully. Redirecting...'}
                            </p>
                            {step === 'request' && (
                                <Button
                                    onClick={() => setSuccess(false)}
                                    variant="outline"
                                    className="mt-4 border-white/10 hover:bg-white/5 text-slate-300"
                                >
                                    Back to Input
                                </Button>
                            )}
                        </motion.div>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => router.push('/login')}
                        className="text-slate-500 hover:text-indigo-400 transition-colors text-sm font-medium"
                    >
                        ← Back to Login
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
