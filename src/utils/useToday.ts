import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { todayString } from './date';

export function useToday(): string {
  const [today, setToday] = useState(todayString());

  useEffect(() => {
    const update = () => setToday(todayString());
    const timer = setInterval(update, 30000);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') update();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);

  return today;
}