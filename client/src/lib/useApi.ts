import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "./api";

interface State<T> {
  key: string;
  data?: T;
  error?: string;
}

// Loads data whenever `deps` change. Keeps the previous data visible while a
// new request is in flight so lists do not flash empty.
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[]) {
  const [nonce, setNonce] = useState(0);
  const key = JSON.stringify([deps, nonce]);
  const [state, setState] = useState<State<T>>({ key: "" });

  useEffect(() => {
    let cancelled = false;
    fetcher().then(
      (data) => !cancelled && setState({ key, data }),
      (error) => !cancelled && setState((prev) => ({ key, data: prev.data, error: errorMessage(error) }))
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback((data: T) => setState((prev) => ({ ...prev, data })), []);

  return {
    data: state.data,
    error: state.key === key ? state.error : undefined,
    loading: state.key !== key,
    initialLoading: state.key !== key && state.data === undefined,
    reload,
    setData,
  };
}
