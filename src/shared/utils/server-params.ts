import { cache } from 'react';

const serverContext = cache<() => { params: object }>(() => ({
  params: {},
}));

/**
 * TODO: docs
 */
export const useServerParams = <T extends object>() => {
  return serverContext().params as T;
};

export const setServerParams = <T extends object>(params: T) => {
  serverContext().params = params;
};
