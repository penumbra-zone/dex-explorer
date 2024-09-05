import { Box, Flex, Text } from "@chakra-ui/react";
import Layout from "../../components/layout";
import { LPSearchBar } from "../../components/lpSearchBar";
import Trades from '../../components/trades'

export default function Explorer() {
  return (
    <Layout pageTitle={`Explorer`}>
      <Box p={8}>
        <Flex width="100%" justifyContent={"center"} alignItems={"center"} flexDirection={"column"} mb={8}>
          <Text as="h1" fontWeight={600} fontSize={20} mb={4}>
            Penumbra Explorer
          </Text>
          <LPSearchBar />
        </Flex>
        <Flex gap={6}>
          <Box className="box-card" w="50%" p={6} mb={6}>
            <Text as="h2" fontWeight={600} fontSize={20} mb={4}>
              Recents Blocks
            </Text>
            <Trades />
          </Box>
          <Box className="box-card" w="50%" p={6} mb={6}>
            <Text as="h2" fontWeight={600} fontSize={20} mb={4}>
              Recents Swaps
            </Text>
          </Box>
        </Flex>
      </Box>
    </Layout>
  );
}