import { useQuery } from '@tanstack/react-query';
import type { PriceResponse } from '@/shared/api/server/prices';
import { apiFetch } from '@/shared/utils/api-fetch';

export const usePrices = (symbols: string[]) => {
    console.log('usePrices called with symbols:', symbols);
    return useQuery({
        queryKey: ['prices', symbols],
        queryFn: async () => {
            const params = new URLSearchParams();
            symbols.forEach(symbol => params.append('symbol', symbol));
            const url = `/api/prices?${params.toString()}`;
            console.log('Fetching prices from:', url);
            const response = await apiFetch<PriceResponse[]>(url);
            console.log('Price API response:', response);
            return response;
        },
        enabled: symbols.length > 0,
    });
}; 