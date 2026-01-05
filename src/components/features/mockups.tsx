import { CheckCircle2, ChevronRight, BarChart3, Clock, Brain, FileText } from 'lucide-react';

export function MockExam() {
    return (
        <div className="absolute top-8 left-8 right-8 bg-slate-950 border border-white/10 rounded-xl p-6 shadow-2xl transform group-hover:scale-[1.02] transition-transform duration-500 origin-top">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">ETHICS</span>
                    <span className="text-xs text-slate-500">Question 14 of 90</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>01:45</span>
                </div>
            </div>

            {/* Question */}
            <p className="text-sm text-slate-200 mb-6 leading-relaxed">
                According to the Standard regarding referral fees, a member must disclose any benefit received for the recommendation of services to:
            </p>

            {/* Options */}
            <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-white/5 opacity-50">
                    <div className="w-4 h-4 rounded-full border border-slate-600" />
                    <span className="text-sm text-slate-400 line-through">Only potential clients</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-emerald-100">Employers, clients, and prospective clients</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-white/5 opacity-50">
                    <div className="w-4 h-4 rounded-full border border-slate-600" />
                    <span className="text-sm text-slate-400">Employers and clients only</span>
                </div>
            </div>
        </div>
    );
}

export function MockAnalytics() {
    return (
        <div className="absolute top-12 left-6 right-6 bottom-0">
            <div className="flex items-end justify-between h-48 gap-2 px-4">
                {[45, 60, 50, 75, 65, 85, 80].map((h, i) => (
                    <div key={i} className="w-full relative group/bar">
                        <div
                            className="absolute bottom-0 left-0 right-0 bg-indigo-500/20 rounded-t-lg transition-all duration-500 group-hover:bg-indigo-500/40"
                            style={{ height: `${h}%` }}
                        >
                            <div
                                className="absolute top-0 left-0 right-0 h-1 bg-indigo-500/50"
                            />
                        </div>
                    </div>
                ))}
            </div>
            {/* Floating Badge */}
            <div className="absolute top-0 right-0 bg-slate-900/90 backdrop-blur border border-white/10 p-3 rounded-xl shadow-xl flex items-center gap-3 transform translate-x-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                    <div className="text-xs text-slate-400">Accuracy</div>
                    <div className="text-sm font-bold text-white">Top 15%</div>
                </div>
            </div>
        </div>
    );
}

export function MockPlanner() {
    return (
        <div className="absolute top-10 -right-10 -left-10 transform -rotate-2">
            <div className="flex gap-4 overflow-hidden py-4 px-8">
                {[
                    { day: 'Mon', sub: 'Quant', status: 'done' }, // Complete
                    { day: 'Tue', sub: 'Econ', status: 'done' },  // Complete
                    { day: 'Wed', sub: 'FRA', status: 'active' }, // Active
                    { day: 'Thu', sub: 'Corp', status: 'pend' },  // Pending
                    { day: 'Fri', sub: 'Equity', status: 'pend' }, // Pending
                ].map((item, i) => (
                    <div
                        key={i}
                        className={`flex-shrink-0 w-32 p-4 rounded-2xl border ${item.status === 'active'
                                ? 'bg-slate-800 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)] scale-110 z-10'
                                : item.status === 'done'
                                    ? 'bg-slate-900/50 border-emerald-500/20 opacity-60'
                                    : 'bg-slate-900/30 border-white/5 opacity-40'
                            }`}
                    >
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">{item.day}</div>
                        <div className="font-bold text-white mb-2">{item.sub}</div>
                        {item.status === 'done' && <div className="h-1.5 w-full bg-emerald-500/20 rounded-full overflow-hidden"><div className="h-full w-full bg-emerald-500" /></div>}
                        {item.status === 'active' && <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden"><div className="h-full w-3/4 bg-indigo-500" /></div>}
                        {item.status === 'pend' && <div className="h-1.5 w-full bg-slate-800 rounded-full" />}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function MockEssay() {
    return (
        <div className="absolute top-8 left-8 right-8 bg-slate-50 p-6 rounded-t-xl text-slate-900 shadow-xl origin-bottom transform group-hover:-translate-y-2 transition-transform duration-500">
            <div className="flex items-center justify-between mb-4 border-b border-indigo-100 pb-2">
                <span className="font-serif font-bold text-indigo-900">Response</span>
                <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                    <Brain className="w-3 h-3" />
                    AI Grading
                </div>
            </div>
            <p className="font-serif text-sm leading-relaxed text-slate-700 opacity-60">
                The portfolio manager should effectively utilize... <span className="bg-red-100 text-red-700 px-1 rounded mx-1 line-through decoration-red-400">leverage</span>
                <span className="bg-green-100 text-green-800 px-1 rounded font-medium border border-green-200">risk-adjusted strategies</span>
                to mitigate the potential downside...
            </p>

            <div className="absolute -right-4 top-12 bg-white p-3 rounded-xl shadow-lg border border-slate-100 transform rotate-6">
                <div className="text-center">
                    <div className="text-xs text-slate-400 uppercase font-bold">Score</div>
                    <div className="text-2xl font-black text-indigo-600">8/10</div>
                </div>
            </div>
        </div>
    );
}

export function MockItemSet() {
    return (
        <div className="absolute inset-0 flex">
            {/* Left Panel: Vignette */}
            <div className="w-1/2 bg-slate-900/80 border-r border-white/5 p-6 pt-10">
                <div className="w-3/4 h-3 bg-slate-700/50 rounded mb-3" />
                <div className="w-full h-3 bg-slate-700/30 rounded mb-3" />
                <div className="w-5/6 h-3 bg-slate-700/30 rounded mb-3" />
                <div className="w-full h-3 bg-slate-700/30 rounded mb-6" />

                <div className="w-1/2 h-20 bg-indigo-900/10 border border-indigo-500/20 rounded-lg p-3">
                    <div className="flex justify-between mb-2">
                        <div className="w-8 h-2 bg-indigo-400/20 rounded" />
                        <div className="w-8 h-2 bg-indigo-400/20 rounded" />
                    </div>
                </div>
            </div>

            {/* Right Panel: Questions */}
            <div className="w-1/2 p-6 pt-12 opacity-80">
                <div className="w-full h-4 bg-slate-600/50 rounded mb-6" />
                <div className="space-y-3">
                    <div className="w-full h-10 border border-white/10 rounded-lg" />
                    <div className="w-full h-10 border border-white/10 rounded-lg" />
                    <div className="w-full h-10 bg-indigo-600 rounded-lg flex items-center px-4 shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                        <div className="w-2 h-2 rounded-full bg-white mr-3" />
                        <div className="w-20 h-2 bg-white/30 rounded" />
                    </div>
                </div>
            </div>
        </div>
    )
}
