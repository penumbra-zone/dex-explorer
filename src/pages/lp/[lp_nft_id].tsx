import Layout from '@/components/layout';
import { LPID, LPUpdate } from '@/penumbra/dex';
import { Box, Text, VStack } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { Position } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/util/loadingSpinner';
import CurrentLPStatus from '@/components/liquidityPositions/currentStatus';
import ShowLPUpdate from '@/components/liquidityPositions/showLPUpdate';

interface PositionInformation {
  lpID: LPID;
  position: Position;
  updates: LPUpdate[];
}

async function updates(lpID: LPID): Promise<LPUpdate[] | { error: string }> {
  const res = await fetch(`/api/lp/${lpID}/updates`);
  if (res.status === 200) {
    try {
      return LPUpdate.JSON_SCHEMA.array().parse(await res.json());
    } catch (e) {
      return { error: String(e) };
    }
  }
  return (await res.json()) as { error: string };
}

async function position(lpID: LPID): Promise<Position | { error: string }> {
  const res = await fetch(`/api/lp/${lpID}/position`);
  if (res.status === 200) {
    return (await res.json()) as Position;
  } else {
    return (await res.json()) as { error: string };
  }
}

async function positionInformation(lpID: LPID): Promise<PositionInformation | { error: string }> {
  // Go called and wants this function back.
  const [theUpdates, thePosition] = await Promise.all([updates(lpID), position(lpID)]);
  if ('error' in thePosition) {
    return thePosition;
  }
  if ('error' in theUpdates) {
    return theUpdates;
  }
  return { lpID, position: thePosition, updates: theUpdates };
}

function PositionSection({ lpID, position }: PositionInformation) {
  return (
    <VStack align='stretch'>
      <Text fontWeight='bold' width='100%' fontSize='1.5em' paddingBottom='.5em'>
        Position Status
      </Text>
      <Box className='box-card' padding={30} width={{ base: '100%', md: '40em' }}>
        <CurrentLPStatus nftId={lpID} position={position} />
      </Box>
    </VStack>
  );
}

function ShowPositionInformation({
  positionInformation,
}: {
  positionInformation: PositionInformation;
}) {
  return (
    <Box display='flex' flexDirection='column' alignItems='center' width='100%'>
      <VStack spacing='2em' width='full' maxW='container.md' px={4}>
        <VStack align='stretch' paddingTop='3em'>
          <PositionSection {...positionInformation} />
        </VStack>
        <VStack align='start'>
          <Text fontWeight='bold' width='100%' fontSize='1.5em' paddingTop='.5em'>
            Timeline
          </Text>
        </VStack>
        {positionInformation.updates.toReversed().map((update, index) => (
          <VStack align={'flex-start'} paddingY={'1em'} key={index}>
            <ShowLPUpdate
              key={index}
              position={positionInformation.position}
              update={update}
              first={index === positionInformation.updates.length - 1}
            />
          </VStack>
        ))}
      </VStack>
    </Box>
  );
}

export default function Page() {
  const router = useRouter();

  const [title, setTitle] = useState('LP');
  const [position, setPosition] = useState<PositionInformation | { error: string } | null>(null);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    const { lp_nft_id } = router.query as { lp_nft_id: LPID };
    setTitle(`LP - ${lp_nft_id}`);
    positionInformation(lp_nft_id)
      .then(x => {
        setPosition(x);
      })
      .catch((e: unknown) => {
        throw e;
      });
  }, [router.isReady, router.query]);

  let child = <LoadingSpinner />;
  if (position !== null) {
    if ('error' in position) {
      child = (
        <VStack height={'100%'} width={'100%'}>
          <Text paddingTop={'20%'}>Error fetching position: {position.error}</Text>
        </VStack>
      );
    } else {
      child = <ShowPositionInformation positionInformation={position} />;
    }
  }

  return <Layout pageTitle={title}>{child}</Layout>;
}
