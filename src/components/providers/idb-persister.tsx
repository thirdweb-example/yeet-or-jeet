"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";

const persistQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 10 mins
      gcTime: 10 * 60 * 1000,
      staleTime: 10 * 60 * 1000,
    },
  },
});

/**
 * Creates an Indexed DB persister
 * @see https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
 */
function createIDBPersister(idbValidKey: IDBValidKey = "reactQuery") {
  return {
    persistClient: async (client: PersistedClient) => {
      await set(idbValidKey, client);
    },
    restoreClient: async () => {
      return await get<PersistedClient>(idbValidKey);
    },
    removeClient: async () => {
      await del(idbValidKey);
    },
  } satisfies Persister;
}

const idbPersister = createIDBPersister();

export function IdbPersistProvider(props: {
  children?: React.ReactNode;
}) {
  return (
    <PersistQueryClientProvider
      client={persistQueryClient}
      persistOptions={{ persister: idbPersister }}
    >
      {props.children}
    </PersistQueryClientProvider>
  );
}
