'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const pricingPlans = [
    {
        name: 'Free Trial',
        price: '$0',
        description: 'Get a taste of our AI-driven CFA prep experience.',
        features: [
            '30 Practice MCQ Questions',
            'Basic Performance Analytics',
            '5 AI-Powered Explanations/day',
            'Standard Community Access',
        ],
        cta: 'Start for Free',
        highlight: false,
    },
    {
        name: 'Pro (Per Level)',
        price: '$199',
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
    },
    {
        name: 'Platinum Access',
        price: '$499',
        description: 'Lifetime access to all levels and premium support.',
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
    },
];

export function PricingSection() {
    return (
        <section id="pricing" className="py-24 relative overflow-hidden bg-slate-950/20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <span className="text-indigo-400 font-semibold tracking-wider uppercase text-sm">Investment</span>
                    <h2 className="text-4xl lg:text-5xl font-bold text-white mt-3 mb-6">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Invest in your future. Our AI-powered platform helps you study smarter, not harder.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {pricingPlans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative flex flex-col p-8 rounded-[2.5rem] ${plan.highlight
                                ? 'bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border-indigo-500/30'
                                : 'bg-slate-900/40 border-white/5'
                                } border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                                    Recommended
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                                    {plan.price !== '$0' && <span className="text-slate-400 text-sm">{plan.name.includes('Pro') ? '/Level' : '/One-time'}</span>}
                                </div>
                                <p className="text-sm text-slate-400">{plan.description}</p>
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
                                    className={`w-full h-12 rounded-xl font-bold transition-all ${plan.highlight
                                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20'
                                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                                        }`}
                                >
                                    {plan.cta}
                                </Button>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <p className="text-slate-500 text-xs max-w-2xl mx-auto leading-relaxed">
                        CFA Institute does not endorse, promote or warrant the accuracy or quality of the products or services offered by CFA Prep AI. CFA® and Chartered Financial Analyst® are registered trademarks owned by CFA Institute.
                    </p>
                </div>
            </div>
        </section>
    );
}
