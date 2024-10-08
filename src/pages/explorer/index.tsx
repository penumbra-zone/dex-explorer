// @ts-nocheck
/* eslint-disable -- disabling this file as this was created before our strict rules */
import { Box, Flex, Text } from '@chakra-ui/react';
import Layout from '@/old/components/layout';
import { LPSearchBar } from '@/old/components/lpSearchBar';
import Blocks from '@/old/components/blocks';
import Swaps from '@/old/components/swaps';

export default function Explorer() {
  return (
    <Layout pageTitle={`Explorer`}>
      <Box p={8}>
        <Flex
          width='100%'
          justifyContent={'center'}
          alignItems={'center'}
          flexDirection={'column'}
          mb={8}
        >
          <Text as='h1' fontWeight={600} fontSize={20} mb={4}>
            Penumbra Explorer
          </Text>
          <LPSearchBar />
        </Flex>
        <Flex gap={6} wrap={{ base: 'wrap', lg: 'nowrap' }}>
          <Box className='box-card' w={{ base: '100%', lg: '50%' }} p={6} mb={6}>
            <Text as='h2' fontWeight={600} fontSize={20} mb={4}>
              Recents Blocks
            </Text>
            <Blocks />
          </Box>
          <Box className='box-card' w={{ base: '100%', lg: '50%' }} p={6} mb={6}>
            <Text as='h2' fontWeight={600} fontSize={20} mb={4}>
              Recents Swaps
            </Text>
            <Swaps />
          </Box>
        </Flex>
      </Box>
    </Layout>
  );
}
