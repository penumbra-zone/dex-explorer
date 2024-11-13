import type { ReactNode } from 'react';
import { Text } from '@penumbra-zone/ui/Text';

export interface InfoCardProps {
  title: string;
  loading?: boolean;
  children: ReactNode;
}

export const InfoCard = ({ title, loading, children }: InfoCardProps) => {
  return (
    <div className='flex flex-col justify-center items-start w-full p-3 desktop:p-6 rounded-lg bg-other-tonalFill5 backdrop-blur-lg'>
      <Text detail color='text.secondary'>
        {title}
      </Text>
      {loading ? (
        <div className='py-[6px] px-0'>
          <div className='w-14 h-4 bg-shimmer rounded-xs' />
        </div>
      ) : (
        <div className='flex items-baseline justify-start gap-2'>{children}</div>
      )}
    </div>
  );
};
