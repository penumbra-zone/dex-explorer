import { useQuery } from '@tanstack/react-query';

// useEffect(() => {
//   setIsLPsLoading(true);

//   try {
//     // Get token 1 & 2
//     const asset1Token = tokenAssets.find(
//       x => x.display.toLocaleLowerCase() === token1Symbol.toLocaleLowerCase(),
//     );
//     const asset2Token = tokenAssets.find(
//       x => x.display.toLocaleLowerCase() === token2Symbol.toLocaleLowerCase(),
//     );
//     if (!asset1Token || !asset2Token) {
//       setIsLoading(false);
//       setIsChartLoading(false);
//       setIsLPsLoading(false);
//       setError(`Token not found: ${!asset1Token ? token1Symbol : token2Symbol}`);
//       return;
//     }
//     setError(undefined);

//     const lpsBuySidePromise = fetch(
//       `/api/lp/positionsByPrice/${asset2Token.display}/${asset1Token.display}/${LPS_TO_RENDER}`,
//     ).then(res => res.json());
//     const lpsSellSidePromise = fetch(
//       `/api/lp/positionsByPrice/${asset1Token.display}/${asset2Token.display}/${LPS_TO_RENDER}`,
//     ).then(res => res.json());

//     Promise.all([lpsBuySidePromise, lpsSellSidePromise])
//       .then(([lpsBuySideResponse, lpsSellSideResponse]) => {
//         if (
//           !lpsBuySideResponse ||
//           lpsBuySideResponse.error ||
//           !lpsSellSideResponse ||
//           lpsSellSideResponse.error
//         ) {
//           console.error('Error querying liquidity positions');
//           setError('Error querying liquidity positions');
//         }
//         setError(undefined);

//         console.log('lpsBuySideResponse', lpsBuySideResponse);
//         console.log('lpsSellSideResponse', lpsSellSideResponse);

//         setLPsBuySide(lpsBuySideResponse as Position[]);
//         setLPsSellSide(lpsSellSideResponse as Position[]);
//       })
//       .catch(error => {
//         console.error('Error querying lps', error);
//       })
//       .finally(() => {
//         setIsLPsLoading(false);
//       });
//     setError(undefined);
//   } catch (error) {
//     console.error('Error querying liquidity positions', error);
//     setError('Error querying liquidity positions');
//     setIsLPsLoading(false);
//   }
// }, [tokenAssets.length, token1Symbol, token2Symbol]);

export const useBook = (symbol1: string, symbol2: string, lpDepth: number) => {
  return useQuery({
    queryKey: ['book'],
    queryFn: async (): Promise<ClientEnv> => {
      const res = await fetch(`/api/book/${symbol1}/${symbol2}/${lpDepth}`);
      return (await res.json()) as ClientEnv;
    },
    staleTime: Infinity,
  });
};
