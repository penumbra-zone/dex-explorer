import { Ban } from 'lucide-react';
import { Button } from '@penumbra-zone/ui/Button';
import { Density } from '@penumbra-zone/ui/Density';
import { Text } from '@penumbra-zone/ui/Text';
import { useState } from 'react';
import { ErrorDetailsModal } from './error-details-modal';

interface BlockchainErrorProps {
  message?: string;
}

export function BlockchainError({
  message = 'An error occurred when loading data from the blockchain',
}: BlockchainErrorProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <>
      <Density compact>
        <div className='flex flex-row items-center w-full justify-center gap-4 flex-wrap'>
          <Ban className='h-8 w-8 text-red-400' />
          <Text small color='text.secondary'>
            {message}
          </Text>
          <Button onClick={() => setIsDetailsOpen(true)}>Details</Button>
        </div>
      </Density>

      <ErrorDetailsModal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} />
    </>
  );
}
