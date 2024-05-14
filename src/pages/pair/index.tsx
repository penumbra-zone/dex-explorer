// pages/pairs.tsx

import React, { useState, useEffect } from 'react';
import { VStack, HStack, Box, Select, Button, FormControl, useBoolean } from '@chakra-ui/react';
import Layout from '@/components/layout';
import { fetchAllTokenAssets } from '@/utils/token/tokenFetch';

const TokenAssets = fetchAllTokenAssets().sort((a, b) => a.display > b.display ? 1 : b.display > a.display ? -1 : 0);

export default function Pairs() {
    const [firstAsset, setFirstAsset] = useState('');
    const [secondAsset, setSecondAsset] = useState('');

    const handleSelectEvent = (value : string, assetIndex: number) => {
        if (assetIndex == 0) {
            setFirstAsset(value)
        } else {
            setSecondAsset(value)
        }
    }

    const handleSubmitEvent = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (firstAsset && secondAsset) {
            location.assign("/pair/" + firstAsset.toLowerCase() + ":" + secondAsset.toLowerCase())
        }
    }

    return (
        <Layout pageTitle='Pairs'>
            <VStack height={'100%'} width={'100%'}>
                <HStack justifyContent={'space-evenly'} width={'100%'} paddingTop={'5%'}>
                    <Box>
                    <Select placeholder='Select First Asset' onChange={(e) => handleSelectEvent(e.target.value, 0)}>
                        {TokenAssets.map((x) => (<option value={x.display}>{x.display}</option>))}
                    </Select>
                    </Box>
                    <Box>
                    <Select placeholder='Select Second Asset' onChange={(e) => handleSelectEvent(e.target.value, 1)}>
                        {TokenAssets.map((x) => (<option value={x.display}>{x.display}</option>))}
                    </Select>
                    </Box>
                </HStack>
                <Box paddingTop = '10%'>
                    <form onSubmit={handleSubmitEvent}>
                        <Button type='submit' variant='outline' colorScheme={'whiteAlpha'} >
                            See Graph
                        </Button>
                    </form>
                </Box>
            </VStack>
        </Layout>
    )
}
