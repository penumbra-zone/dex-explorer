import type { ReactNode } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Text } from '@penumbra-zone/ui/Text';
import { Skeleton } from '@/shared/ui/skeleton';

export interface InfoCardProps {
  title: string;
  loading?: boolean;
  children: ReactNode;
}

export const InfoCard = ({ title, loading, children }: InfoCardProps) => {
  const [parent] = useAutoAnimate();

  return (
    <div
      ref={parent}
      className='flex flex-col justify-center items-start w-full p-3 desktop:p-6 rounded-lg bg-other-tonalFill5 backdrop-blur-lg'
    >
      <Text detail color='text.secondary'>
        {title}
      </Text>
      {loading ? (
        <div className='w-14 h-7 py-[6px] px-0'>
          <Skeleton />
        </div>
      ) : (
        <div className='flex items-baseline justify-start gap-2'>{children}</div>
      )}
    </div>
  );
};
