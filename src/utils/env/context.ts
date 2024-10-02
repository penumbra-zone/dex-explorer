'use client';

import { createContext, useContext } from 'react';

export const EnvContext = createContext<Record<string, string>>({});

export function useEnvContext() {
  return useContext(EnvContext);
}
