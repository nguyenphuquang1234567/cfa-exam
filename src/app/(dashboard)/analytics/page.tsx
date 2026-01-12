'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  BookOpen,
  Award,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatsCard } from '@/components/analytics/stats-card';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { useAuthenticatedSWR } from '@/hooks/use-authenticated-swr';

const PerformanceChart = dynamic(() => import('@/components/analytics/performance-chart').then(mod => mod.PerformanceChart), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-slate-900/10 animate-pulse rounded-xl border border-white/5" />
});

interface TopicData {
  name: string;
  accuracy: number | null;
  attempts: number;
}

const formatStudyHours = (seconds: number) => {
  if (seconds < 3600 && seconds > 0) {
    return `${Math.round(seconds / 60)}m`;
  }
  return `${(seconds / 3600).toFixed(1)}h`;
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const localDate = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  // Use SWR for fetching data
  const { data: topicsData, isLoading: topicsLoading } = useAuthenticatedSWR<any[]>(
    user ? `/api/quiz/topics?userId=${user.uid}` : null
  );

  const { data: statsData, isLoading: statsLoading } = useAuthenticatedSWR<any>(
    user ? `/api/user/stats?userId=${user.uid}&date=${localDate}` : null
  );

  const isLoading = topicsLoading || statsLoading;

  // Memoized transformations
  const transformedTopics = useMemo(() => {
    if (!topicsData || !Array.isArray(topicsData)) return [];
    return topicsData.map((item: any) => ({
      name: item.name,
      accuracy: item.accuracy,
      attempts: item.questions,
    }));
  }, [topicsData]);

  const stats = useMemo(() => {
    return {
      totalQuestions: statsData?.totalQuestions || 0,
      averageScore: statsData?.averageScore || 0,
      weeklyTrend: statsData?.weeklyTrend || 0,
      timeSpentThisMonth: statsData?.timeSpentThisMonth || 0,
      monthlyTimeTrend: statsData?.monthlyTimeTrend || 0,
      chartData: statsData?.chartData || [],
      errorAnalysis: statsData?.errorAnalysis || [
        { type: 'Conceptual Error', count: 0, percentage: 0 },
        { type: 'Calculation Mistake', count: 0, percentage: 0 }
      ]
    };
  }, [statsData]);

  const masteredTopicsCount = useMemo(() => {
    return transformedTopics.filter(t => t.accuracy !== null && t.accuracy >= 70).length;
  }, [transformedTopics]);

  if (!isMounted) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-foreground"
          >
            Analytics
          </motion.h1>
          <p className="text-muted-foreground mt-1">
            Track your progress and identify areas for improvement
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1">
            <Calendar className="h-3 w-3" />
            Last 8 Weeks
          </Badge>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Questions", value: stats.totalQuestions.toLocaleString(), subtitle: "All time", icon: BookOpen, color: "indigo" as const },
          { title: "Overall Accuracy", value: `${stats.averageScore}%`, icon: Target, trend: { value: Math.abs(stats.weeklyTrend), isPositive: stats.weeklyTrend >= 0 }, color: "emerald" as const },
          { title: "Study Hours", value: formatStudyHours(stats.timeSpentThisMonth), subtitle: "This month", icon: Clock, trend: { value: Math.abs(stats.monthlyTimeTrend), isPositive: stats.monthlyTimeTrend >= 0 }, color: "amber" as const },
          { title: "Topics Mastered", value: `${masteredTopicsCount}/${transformedTopics.length || 10}`, subtitle: ">70% accuracy", icon: Award, color: "purple" as const }
        ].map((item, i) => (
          isLoading ? (
            <Card key={i} className="border border-border bg-card/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-9 w-20 rounded-lg" />
                    <Skeleton className="h-3 w-32 rounded-sm" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <StatsCard
              key={i}
              title={item.title}
              value={item.value}
              subtitle={item.subtitle}
              icon={item.icon}
              trend={'trend' in item ? item.trend : undefined}
              color={item.color}
              delay={0.1 * i}
            />
          )
        ))}
      </div>

      {/* Performance Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="h-full bg-card border-border rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border p-6">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              Performance Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <Skeleton className="h-[300px] w-full rounded-xl" />
            ) : (
              <PerformanceChart weeklyData={stats.chartData} topicData={transformedTopics} />
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Error Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="h-full bg-card border-border rounded-2xl">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-400" />
                Error Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))
              ) : (
                stats.errorAnalysis.map((error: any) => (
                  <div key={error.type} className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium">{error.type}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground/60">{error.count} errors</span>
                        <span className="text-foreground font-bold">{error.percentage}%</span>
                      </div>
                    </div>
                    <Progress
                      value={error.percentage}
                      className="h-2"
                      indicatorClassName={
                        error.percentage >= 30
                          ? 'from-red-600 to-rose-600'
                          : error.percentage >= 20
                            ? 'from-amber-600 to-orange-600'
                            : 'from-indigo-600 to-violet-600'
                      }
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Dynamic Recommendations - placeholder logic for now */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="h-full bg-card border-border rounded-2xl">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-400" />
                Study Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))
                ) : transformedTopics.filter(t => t.accuracy !== null && t.accuracy < 60).length > 0 ? (
                  transformedTopics.filter(t => t.accuracy !== null && t.accuracy < 60).slice(0, 3).map((topic, i) => (
                    <div key={i} className="p-4 rounded-xl border border-red-500/10 bg-red-500/5">
                      <h4 className="font-bold text-red-400 text-sm mb-1 uppercase tracking-wider">{topic.name}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Your accuracy is currently {topic.accuracy}%. Focus on reviewing core concepts and practicing vignette-style questions.
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Keep up the great work! No immediate focus areas detected.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Topic Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="bg-card border-border rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border p-6">
            <CardTitle className="text-xl font-bold">Topic Mastery Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {isLoading ? (
                Array(10).fill(0).map((_, i) => (
                  <div key={i} className="p-5 rounded-2xl border border-border bg-muted/20 space-y-4">
                    <div className="flex justify-between">
                      <Skeleton className="h-8 w-12" />
                      <Skeleton className="h-5 w-8" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))
              ) : (
                transformedTopics.map((topic, idx) => (
                  <motion.div
                    key={topic.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + idx * 0.05 }}
                    className="p-5 rounded-2xl bg-muted/30 border border-border hover:border-indigo-500/30 transition-all cursor-default group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`text-2xl font-black font-mono ${topic.accuracy === null
                          ? 'text-slate-500'
                          : topic.accuracy >= 70
                            ? 'text-emerald-400'
                            : topic.accuracy >= 50
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }`}
                      >
                        {topic.accuracy !== null ? `${topic.accuracy}%` : 'N/A'}
                      </span>
                      <Badge variant="secondary" className="bg-background/50 border-border text-[10px] uppercase font-bold tracking-tighter">
                        {topic.attempts} items
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-4 truncate group-hover:text-foreground transition-colors">
                      {topic.name}
                    </p>
                    <Progress
                      value={topic.accuracy || 0}
                      className="h-1.5"
                      indicatorClassName={
                        topic.accuracy === null
                          ? 'bg-slate-700'
                          : topic.accuracy >= 70
                            ? 'from-emerald-600 to-teal-600'
                            : topic.accuracy >= 50
                              ? 'from-amber-600 to-orange-600'
                              : 'from-red-600 to-rose-600'
                      }
                    />
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
