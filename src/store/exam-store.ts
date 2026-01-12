import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ExamState {
    date: Date | null;
    label: string;
    setExam: (date: Date, label: string) => void;
    daysRemaining: () => number;
}

export const useExamStore = create<ExamState>()(
    persist(
        (set, get) => ({
            date: null,
            label: 'Select Date',
            setExam: (date, label) => set({ date, label }),
            daysRemaining: () => {
                const { date } = get();
                if (!date) return 0;
                // Normalize both to UTC midnight for precise day difference
                const todayStr = new Date().toLocaleDateString('en-CA');
                const today = new Date(todayStr + 'T00:00:00Z');
                const target = new Date(new Date(date).toLocaleDateString('en-CA') + 'T00:00:00Z');

                const diffTime = target.getTime() - today.getTime();
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                return diffDays > 0 ? diffDays : 0;
            },
        }),
        {
            name: 'cfa-exam-storage', // unique name for localStorage
            partialize: (state) => ({ date: state.date, label: state.label }), // persist date and label
        }
    )
);
