import { VStack, Text, HStack, Box } from '@chakra-ui/react';
import AssetView from '../AssetView';
import { Position } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { LPUpdate } from '@/penumbra/dex';
import BlockTimestampView from '../blockTimestamp';

interface LPAssetViewProps {
  title: string;
  asset1: Uint8Array;
  reserves1: bigint;
  asset2: Uint8Array;
  reserves2: bigint;
}

function LPAssetView({ title, asset1, reserves1, asset2, reserves2 }: LPAssetViewProps) {
  return (
    <VStack align={'left'} spacing={2} paddingTop={'.5em'}>
      <Text fontSize={'medium'} fontStyle={'oblique'}>
        {title}
      </Text>
      <HStack>
        <AssetView asset={asset1} amount={reserves1} />
        <AssetView asset={asset2} amount={reserves2} />
      </HStack>
    </VStack>
  );
}

export default function ShowLPUpdate({
  position,
  update,
  first,
}: {
  position: Position;
  update: LPUpdate;
  first: boolean;
}) {
  let state: string;
  let title: string;
  if (update.state === 'opened') {
    state = first ? 'open' : 'fill';
    title = first ? 'Initial Reserves' : 'Updated Reserves';
  } else if (update.state === 'closed') {
    state = 'close';
    title = 'Final Reserves';
  } else {
    state = 'withdraw';
    title = 'Remaining Reserves';
  }
  const asset1 = position.phi?.pair?.asset1?.inner;
  const asset2 = position.phi?.pair?.asset2?.inner;
  if (!asset1) {
    throw new Error(`position missing "asset1": ${position.phi?.toJsonString()}`);
  }
  if (!asset2) {
    throw new Error(`position missing "asset2": ${position.phi?.toJsonString()}`);
  }

  return (
    <HStack
      spacing={{ base: '1em', md: '5em' }}
      flexDirection={{ base: 'column', md: 'row' }}
      alignItems={{ base: 'flex-start', md: 'center' }}
      width={['95vw', 'inherit']}
    >
      <Box
        className='box-card'
        width={{ base: '100%', md: '25em' }}
        height={'7em'}
        padding='2em'
        display={'flex'}
      >
        <HStack align={'center'} spacing={10}>
          <Text fontSize={'large'} fontWeight={'bold'}>
            {state}
          </Text>
          <HStack align={'center'} spacing={2}>
            <LPAssetView
              title={title}
              asset1={asset1}
              asset2={asset2}
              reserves1={update.reserves1}
              reserves2={update.reserves2}
            />
          </HStack>
        </HStack>
      </Box>
      <VStack spacing={'.5em'} align={'flex-start'}>
        <BlockTimestampView
          blockHeight={update.block.height}
          timestamp={update.block.created.toString()}
        />
      </VStack>
    </HStack>
  );
}
