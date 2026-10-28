import { useEffect } from 'react';
import { useQuery } from '../lib/query';
import { monthKey } from '../lib/format';
import usePeriod from '../store/period';

/** Months that have data (newest first) and the shared selected month. */
export default function useMonths() {
  const { data, loading, error, refetch } = useQuery('/analytics/monthly/');
  const months = (data?.months || []).map(monthKey);
  const { month, setMonth } = usePeriod();

  useEffect(() => {
    if (months.length && !months.includes(month)) setMonth(months[0]);
  }, [months.join(','), month]); // eslint-disable-line react-hooks/exhaustive-deps

  const index = months.indexOf(month);
  return {
    months,
    month: months.includes(month) ? month : months[0] || '',
    setMonth,
    loading,
    error,
    refetch,
    hasData: months.length > 0,
    older: index >= 0 && index < months.length - 1 ? months[index + 1] : null,
    newer: index > 0 ? months[index - 1] : null,
  };
}
