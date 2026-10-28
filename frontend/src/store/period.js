import { create } from 'zustand';

// The month the user is looking at, shared by every page so switching
// month on the dashboard carries over to budgets, transactions and reports.
const usePeriod = create((set) => ({
  month: '', // 'YYYY-MM'
  setMonth: (month) => set({ month }),
}));

export default usePeriod;
