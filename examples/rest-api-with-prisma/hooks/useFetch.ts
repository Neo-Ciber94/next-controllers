import { AsMilliseconds, toMilliseconds } from 'lib/utils';
import { useEffect, useRef, useState } from 'react';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface UseEffectConfig<T> {
  init?: RequestInit;
  delay?: AsMilliseconds;
  refreshTime?: AsMilliseconds;
  transform?: (res: Response) => Promise<T>;
}

export function useFetch<T = any>(url: string, config: UseEffectConfig<T> = {}) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [renderCount, setRenderCount] = useState(0);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [isRefetching, setRefetching] = useState(false);

  // Abort controller
  const abortControllerRef = useRef<AbortController>();

  const transform = config.transform || ((res) => res.json());
  const abort = () => abortControllerRef.current?.abort();
  const refetch = () => {
    setRefetching(true);
    setRenderCount((render) => render + 1);
  };

  const cleanUp = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  };

  useEffect(() => {
    let isCanceled = false;

    const fetchData = async () => {
      if (isCanceled) {
        return;
      }

      setLoading(true);

      try {
        if (config.delay && config.delay > 0) {
          await delay(toMilliseconds(config.delay));
        }

        abortControllerRef.current = new AbortController();
        const { signal } = abortControllerRef.current;

        const res = await fetch(url, { ...config.init, signal });
        const data = await transform(res);
        setData(data);

        if (config.refreshTime && config.refreshTime > 0) {
          const id = setTimeout(refetch, toMilliseconds(config.refreshTime));
          setTimeoutId(id);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          isCanceled = true;
        } else {
          setError(error);
        }
      } finally {
        setLoading(false);
        setRefetching(false);
      }
    };

    // Runs the fetchData function
    fetchData();

    // Clears the timeout
    return () => {
      if (!isCanceled && isLoading) {
        abort();
      }

      cleanUp();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, renderCount]);

  return { data, isLoading, isRefetching, error, abort, refetch };
}
