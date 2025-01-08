import { useQuery } from '@tanstack/react-query';
import type { PriceResponse } from '@/shared/api/server/prices';
import { apiFetch } from '@/shared/utils/api-fetch';

export const usePrices = (symbols: string[]) => {
    return useQuery({
        queryKey: ['prices', symbols],
        queryFn: async () => {
            const params = new URLSearchParams();
            symbols.forEach(symbol => params.append('symbol', symbol));
            const url = `/api/prices?${params.toString()}`;
            return apiFetch<PriceResponse[]>(url);
        },
        enabled: symbols.length > 0,
    });
};
