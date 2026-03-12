import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function useApi(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const load = useCallback(() => {
    setLoading(true); setError(null);
    api(path).then(setData).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load, setData };
}
