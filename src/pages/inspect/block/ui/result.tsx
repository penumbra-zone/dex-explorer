'use client';

import { useParams, useRouter } from 'next/navigation';
import { Text } from '@penumbra-zone/ui/Text';
import { useBlockSummary } from '@/pages/inspect/block/api/use-block-summary';
import { BlockSummary } from './summary';

const ErrorState = ({ error }: { error: unknown }) => {
  return <Text color='destructive.main'>{String(error)}</Text>;
};

export const useBlockHeightInUrl = () => {
  const params = useParams<{ height: string }>();
  const router = useRouter();
  if (!params?.height) {
    router.push('/inspect');
    return '';
  }
  return params.height;
};

export const BlockInspectResult = () => {
  const height = useBlockHeightInUrl();
  const { data, error, isLoading } = useBlockSummary(height);

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <section className='w-full border-t border-t-other-solidStroke overflow-x-hidden'>
      <div className='grid grid-cols-1 divide-y divide-other-solidStroke border-l border-other-solidStroke'>
        <div className='p-4 w-full'>
          <BlockSummary data={data} isLoading={isLoading} />
        </div>
      </div>
    </section>
  );
};
