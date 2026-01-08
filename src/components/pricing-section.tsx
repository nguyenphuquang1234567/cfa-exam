'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { NumberFlow } from '@/components/ui/number-flow';
import { Tab } from '@/components/ui/pricing-tab';

export function PricingSection() {
    const [isYearly, setIsYearly] = useState(true);

    const plans: {
        name: string;
        price: { monthly: number; yearly: number };
        description: string;
        features: string[];
        cta: string;
        highlight: boolean;
        badge?: string;
        glowingVariant: "indigo" | "emerald" | "amber" | "rose" | "cyan" | "white";
    }[] = [
            {
                name: 'Free Trial',
                price: { monthly: 0, yearly: 0 },
                description: 'Get a taste of our AI-driven CFA prep experience.',
                features: [
                    '30 Practice MCQ Questions',
                    'Basic Performance Analytics',
                    '5 AI-Powered Explanations/day',
                    'Standard Community Access',
                ],
                cta: 'Start for Free',
                highlight: false,
                glowingVariant: "white"
            },
            {
                name: 'Pro Access',
                price: { monthly: 29, yearly: 199 },
                description: 'Complete tools for one specific CFA Level.',
                features: [
                    'Full Q-Bank (3000+ Questions)',
                    'Item Set & Vignette Simulator',
                    'Unlimited AI Explanations',
                    'Level III Essay Grading (AI)',
                    'Adaptive Study Planner',
                    'Performance Analytics Pro',
                ],
                cta: 'Get Started',
                highlight: true,
                badge: 'Most Popular',
                glowingVariant: "indigo"
            },
            {
                name: 'Platinum Access',
                price: { monthly: 59, yearly: 499 },
                description: 'Full access to all levels and premium support.',
                features: [
                    'All Levels (I, II, and III)',
                    'Priority Charterholder Support',
                    'Pass Guarantee (Full Refund)',
                    'Downloadable Formula Sheets',
                    'Exclusive Webinar Access',
                    'Mock Interview Program',
                ],
                cta: 'Buy Once, Pass All',
                highlight: false,
                glowingVariant: "amber"
            },
        ];

    return (
        <section id="pricing" className="py-24 relative overflow-hidden bg-slate-950/20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-8">
                    <span className="text-indigo-400 font-semibold tracking-wider uppercase text-sm">Investment</span>
                    <h2 className="text-4xl lg:text-5xl font-bold text-white mt-3 mb-6">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
                        Invest in your future. Our AI-powered platform helps you study smarter, not harder.
                    </p>

                    {/* Billing Toggle */}
                    <div className="mx-auto flex w-fit rounded-full bg-slate-900 border border-white/5 p-1 mb-12">
                        <Tab
                            text="Monthly"
                            selected={!isYearly}
                            setSelected={() => setIsYearly(false)}
                        />
                        <Tab
                            text="Yearly"
                            selected={isYearly}
                            setSelected={() => setIsYearly(true)}
                            discount={true}
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative flex flex-col p-8 rounded-[2.5rem] ${plan.highlight
                                ? 'bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border-indigo-500/30'
                                : 'bg-slate-900/40 border-white/5'
                                } border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] overflow-hidden group`}
                        >
                            <GlowingEffect
                                spread={40}
                                proximity={64}
                                inactiveZone={0.01}
                                variant={plan.glowingVariant}
                            />

                            <div className="relative z-10 flex flex-col h-full">
                                {plan.highlight && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                                        {plan.badge || 'Recommended'}
                                    </div>
                                )}

                                <div className="mb-0">
                                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mb-4 h-16">
                                        <span className="text-4xl sm:text-5xl font-extrabold text-white">$</span>
                                        <span className="text-4xl sm:text-5xl font-extrabold text-white">
                                            <NumberFlow value={isYearly ? plan.price.yearly : plan.price.monthly} />
                                        </span>
                                        <span className="text-slate-400 text-sm font-medium">/{isYearly ? 'yr' : 'mo'}</span>
                                    </div>
                                    <p className="text-sm text-slate-400 h-10 mb-8">{plan.description}</p>
                                </div>

                                <div className="space-y-4 mb-10 flex-grow">
                                    {plan.features.map((feature) => (
                                        <div key={feature} className="flex items-start gap-3">
                                            <div className={`mt-0.5 rounded-full p-1 ${plan.highlight ? 'bg-indigo-500/20' : 'bg-slate-800'}`}>
                                                <Check className={`h-3 w-3 ${plan.highlight ? 'text-indigo-400' : 'text-slate-400'}`} />
                                            </div>
                                            <span className="text-sm text-slate-300">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <Link href="/dashboard" className="block w-full">
                                    <Button
                                        className={`w-full h-14 rounded-2xl font-bold text-base transition-all ${plan.highlight
                                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30'
                                            : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                                            }`}
                                    >
                                        {plan.cta}
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <p className="text-slate-500 text-[10px] max-w-2xl mx-auto leading-relaxed uppercase tracking-widest font-medium opacity-60">
                        CFA Institute does not endorse, promote or warrant the accuracy or quality of the products or services offered by CFA Prep AI. CFA® and Chartered Financial Analyst® are registered trademarks owned by CFA Institute.
                    </p>
                </div>
            </div>
        </section>
    );
}
