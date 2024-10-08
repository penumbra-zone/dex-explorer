// @ts-nocheck
/* eslint-disable -- disabling this file as this was created before our strict rules */
// pages/lp/[lp_nft_id].js

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../../../styles/Home.module.css';
import { Position } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import Layout from '@/old/components/layout';
import CurrentLPStatus from '@/old/components/liquidityPositions/currentStatus';
import { VStack, Text, Box, HStack, IconButton } from '@chakra-ui/react';
import { LoadingSpinner } from '@/old/components/util/loadingSpinner';
import { LiquidityPositionEvent, PositionExecutionEvent } from '@/old/utils/indexer/types/lps';
import TimelinePosition from '@/old/components/liquidityPositions/timelinePosition';
import ExecutionEvent from '@/old/components/liquidityPositions/executionEvent';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useTokenAssetsDeprecated } from '@/fetchers/tokenAssets';

export default function LP() {
  const [isLoading, setIsLoading] = useState(true);
  const [isTimelineLoading, setIsTimelineLoading] = useState(true);
  const [isLineLoading, setIsLineLoading] = useState(true);
  const { data: assetTokens } = useTokenAssetsDeprecated();

  const EXPAND_BUTTON_TYPE_FLAG = 'ExpandButton';

  const router = useRouter();
  const { lp_nft_id } = router.query as { lp_nft_id: string };
  const [liquidityPosition, setLiquidityPosition] = useState<Position | null>(null);
  const [LPData, setLPData] = useState<LiquidityPositionEvent[]>([]);
  const [showAllTradeEvents, setShowAllTradeEvents] = useState(false);
  const numberOfTradeEventsToShow = 2; // Basically n, if there are more than 2^N trade events, show n on each side, else show all
  const [showExpandButton, setShowExpandButton] = useState(false);
  const [hiddenEventCount, setHiddenEventCount] = useState(0);
  const [tradeTimelineData, setTradeTimelineData] = useState<PositionExecutionEvent[]>([]);
  type AbstractLPEvent = LiquidityPositionEvent | PositionExecutionEvent;
  // Note: Needs to be ordered by event id
  const [timelineData, setTimelineData] = useState<
    (LiquidityPositionEvent | PositionExecutionEvent)[]
  >([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setIsLoading(true);
    if (lp_nft_id) {
      const liquidityPositionPromise = fetch(`/api/lp/${lp_nft_id}/position`).then(res =>
        res.json(),
      );

      const lpEventsPromise = fetch(`/api/lp/${lp_nft_id}`).then(res => res.json());
      const lpTradesPromise = fetch(`/api/lp/${lp_nft_id}/trades`).then(res => res.json());

      Promise.all([liquidityPositionPromise, lpEventsPromise, lpTradesPromise])
        .then(([liquidityPositionResponse, lpEventsData, lpTradesData]) => {
          if (!liquidityPositionResponse || liquidityPositionResponse.error) {
            console.error('Error fetching liquidity position: no response');
            setError('Error fetching liquidity position: no response');
            return;
          }

          setLiquidityPosition(liquidityPositionResponse as Position);
          if (!lpEventsData) {
            console.error('Error fetching liquidity position events: no response');
            setError('Error fetching liquidity position events: no response');
            return;
          }
          setLPData(lpEventsData as LiquidityPositionEvent[]);

          if (!lpTradesData) {
            console.error('Error fetching liquidity position execution trade events: no response');
            setError('Error fetching liquidity position execution trade events: no response');
            return;
          }
          setTradeTimelineData(lpTradesData as PositionExecutionEvent[]);
        })
        .catch(error => {
          console.error('Error fetching liquidity position data:', error);
          setError('An error occurred while fetching liquidity position data.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [lp_nft_id]);

  useEffect(() => {
    setIsTimelineLoading(true);
    // Return if no data
    if (LPData.length === 0 && !isLoading) {
      setIsTimelineLoading(false);
      return;
    }

    // Create large list of all events ordered by event_id
    const allEvents: AbstractLPEvent[] = [...LPData, ...tradeTimelineData];

    // Sort primarily by event_id (descending order), then the index id if there are multiple events with the same event_id
    // HOWEVER, If the blocks are the same, put the LP event(s) in the block first
    allEvents.sort((a, b) => {
      if (a.block_height === b.block_height) {
        if ('lpevent_attributes' in a) {
          return 1;
        } else {
          return -1;
        }
      }
      if (a.block_height === b.block_height) {
        return b.event_id - a.event_id;
      }
      return b.block_height - a.block_height;
    });

    // if showAllTradeEvents, dont do anything, however if its false, remove all but the first and last n trade events
    if (!showAllTradeEvents) {
      // Find the first and last trade events
      // ! In theory they always have to be sandwiched between LP events
      let firstTradeIndex = allEvents.findIndex(event => 'lpevent_attributes' in event);
      let lastTradeIndex = allEvents
        .slice()
        .reverse()
        .findIndex(event => 'lpevent_attributes' in event);

      // If there are no trade events, return
      if (firstTradeIndex === -1 || lastTradeIndex === -1 || firstTradeIndex === lastTradeIndex) {
        setTimelineData(allEvents);
        setIsTimelineLoading(false);
        return;
      }

      // If there are more than 2^N trade events, show n on each side, else show all
      if (firstTradeIndex - lastTradeIndex > 2 ** numberOfTradeEventsToShow) {
        firstTradeIndex = lastTradeIndex + numberOfTradeEventsToShow;
        lastTradeIndex = firstTradeIndex + 1;
      } else {
        setTimelineData(allEvents);
        setIsTimelineLoading(false);
        return;
      }

      setShowExpandButton(true);
      setHiddenEventCount(allEvents.length - firstTradeIndex - lastTradeIndex);

      // Remove all but the first and last n trade events
      allEvents.splice(
        firstTradeIndex,
        allEvents.length - firstTradeIndex - lastTradeIndex,
        // put in expand button placeholder
        {
          event_id: -1,
          block_height: -1,
          created_at: '',
          type: EXPAND_BUTTON_TYPE_FLAG,
          block_id: -1,
          tx_id: -1,
          tx_hash: '',
          index: -1,
          execution_event_attributes: {
            positionId: {
              inner: '',
            },
          },
        },
      );
    } else {
      setShowExpandButton(false);
    }

    setTimelineData(allEvents);
    setIsTimelineLoading(false);
  }, [LPData, tradeTimelineData, showAllTradeEvents]);

  const currentStatusRef = useRef<HTMLDivElement>(null);
  const originalStatusRef = useRef<HTMLDivElement>(null);
  const [lineHeight, setLineHeight] = useState(0);
  const [lineTop, setLineTop] = useState(0);

  useEffect(() => {
    setIsLineLoading(true);
    if (currentStatusRef.current && originalStatusRef.current) {
      const firstBoxRect = currentStatusRef.current.getBoundingClientRect();
      const lastBoxRect = originalStatusRef.current.getBoundingClientRect();

      // Calculate the new height of the line to stretch from the bottom of the first box to the top of the last box.
      const newLineHeight = lastBoxRect.top - firstBoxRect.top;
      // Set the top of the line to align with the bottom of the first box.
      const newLineTop = firstBoxRect.bottom - firstBoxRect.top;

      setLineHeight(newLineHeight - 50);
      setLineTop(newLineTop);
    }
    setIsLineLoading(false);
  }, [timelineData, currentStatusRef, originalStatusRef]);

  return (
    <Layout pageTitle={`LP - ${lp_nft_id}`}>
      <main className={styles.main}>
        {isLoading || isTimelineLoading || isLineLoading || !assetTokens.length ? (
          <LoadingSpinner />
        ) : liquidityPosition ? (
          <>
            <Box
              position='relative' // Ensure this Box is the positioning context for the vertical line
              display='flex'
              flexDirection='column'
              alignItems='center'
              width='100%'
            >
              <VStack spacing='2em' width='full' maxW='container.md' px={4}>
                <VStack align='stretch' paddingTop={'3em'}>
                  <VStack align='stretch'>
                    <Text
                      fontWeight={'bold'}
                      width={'100%'}
                      alignContent={'left'}
                      fontSize={'1.5em'}
                      paddingBottom='.5em'
                      alignSelf='flex-start'
                    >
                      Position Status
                    </Text>
                    <Box
                      className='box-card'
                      padding={30}
                      ref={currentStatusRef}
                      width={{ base: '100%', md: '40em' }}
                    >
                      <CurrentLPStatus nftId={lp_nft_id} position={liquidityPosition} />
                    </Box>
                  </VStack>
                  <Text
                    fontWeight={'bold'}
                    width={'100%'}
                    alignContent={'left'}
                    fontSize={'1.5em'}
                    paddingBottom='.5em'
                    alignSelf='flex-start'
                    paddingTop='2em'
                  >
                    Timeline
                  </Text>
                  {timelineData.map((dataItem, index) => (
                    <React.Fragment key={index}>
                      {'lpevent_attributes' in dataItem ? (
                        <VStack align={'flex-start'} paddingTop={index === 0 ? '0' : '3em'}>
                          <VStack ref={originalStatusRef}>
                            <TimelinePosition nftId={lp_nft_id} lp_event={dataItem} />
                          </VStack>
                        </VStack>
                      ) : (
                        <VStack
                          align={['flex-end']}
                          paddingTop={index === 0 ? '0' : '3em'}
                          paddingRight={['0', '5em']}
                        >
                          <VStack>
                            {dataItem.type != EXPAND_BUTTON_TYPE_FLAG ? (
                              <ExecutionEvent nftId={lp_nft_id} lp_event={dataItem} />
                            ) : (
                              showExpandButton && (
                                <HStack
                                  spacing='1em'
                                  align='center'
                                  paddingTop='1em'
                                  justifyContent='center' // Center the button horizontally
                                >
                                  <Text
                                    fontWeight='bold'
                                    fontSize='1.2em'
                                    color='var(--complimentary-background)'
                                    cursor='pointer'
                                    onClick={() => setShowAllTradeEvents(!showAllTradeEvents)}
                                  >
                                    {`+${hiddenEventCount} Hidden`}
                                  </Text>
                                  <IconButton
                                    icon={<ChevronDownIcon />}
                                    onClick={() => setShowAllTradeEvents(!showAllTradeEvents)}
                                    aria-label={'Expand'}
                                    size='md'
                                    colorScheme='var(--complimentary-background)'
                                    color='var(--complimentary-background)'
                                    variant='outline'
                                    _hover={{
                                      backgroundColor: 'var(--purple-emphasis)',
                                    }}
                                  />
                                </HStack>
                              )
                            )}
                          </VStack>
                        </VStack>
                      )}
                    </React.Fragment>
                  ))}
                </VStack>
              </VStack>
            </Box>
            <Box
              position='absolute'
              zIndex={-999}
              left='50%'
              top={`${lineTop}`}
              height={`${lineHeight}`}
              width={'.1em'}
              className='box-card'
              backgroundColor='var(--complimentary-background)'
              id='vertical-line'
            />
            <HStack paddingBottom='5em'></HStack>
          </>
        ) : (
          !isLoading &&
          !liquidityPosition &&
          !isLineLoading &&
          !isTimelineLoading && (
            <VStack height={'100%'} width={'100%'}>
              <Text paddingTop={'20%'}>Liquidity position not found.</Text>
            </VStack>
          )
        )}
      </main>
    </Layout>
  );
}
