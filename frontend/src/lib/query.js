import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import api from './api';

/*
  A deliberately small data layer: cache GET responses by URL, show cached
  data instantly when you come back to a page, refresh it in the background,
  and let mutations invalidate by prefix. Enough for this app without a
  dependency.
*/

const cache = new Map(); // url -> { data, at }
const failed = new Map(); // url -> error (not retried until invalidated or refetched)
const inflight = new Map(); // url -> promise
const listeners = new Set();
let version = 0;

function notify() {
  version += 1;
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function fetchInto(url) {
  if (!inflight.has(url)) {
    const request = api
      .get(url)
      .then((res) => {
        cache.set(url, { data: res.data, at: Date.now() });
        failed.delete(url);
      })
      .catch((error) => {
        failed.set(url, error);
      })
      .finally(() => {
        inflight.delete(url);
        notify();
      });
    inflight.set(url, request);
  }
  return inflight.get(url);
}

/** Drop cached responses whose URL starts with any of the prefixes; mounted queries refetch. */
export function invalidate(...prefixes) {
  const match = (key) => prefixes.length === 0 || prefixes.some((p) => key.startsWith(p));
  for (const key of [...cache.keys()]) if (match(key)) cache.delete(key);
  for (const key of [...failed.keys()]) if (match(key)) failed.delete(key);
  notify();
}

export function clearCache() {
  cache.clear();
  failed.clear();
  notify();
}

export function useQuery(url, { enabled = true } = {}) {
  useSyncExternalStore(subscribe, () => version);
  const active = Boolean(url && enabled);
  const entry = active ? cache.get(url) : undefined;
  const error = active ? failed.get(url) : undefined;
  const [, force] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (!cache.has(url) && !failed.has(url)) fetchInto(url);
    else if (cache.has(url) && Date.now() - cache.get(url).at > 30_000) fetchInto(url);
  });

  const refetch = useCallback(() => {
    if (!url) return Promise.resolve();
    failed.delete(url);
    force((n) => n + 1);
    return fetchInto(url);
  }, [url]);

  return {
    data: entry?.data,
    loading: active && !entry && !error,
    error,
    refetch,
  };
}
