import type { ElementType } from 'react';
import cn from 'clsx';

export interface SkeletonProps {
  as?: ElementType;
}

/**
 * Shimmering skeleton loader. By default, takes the full space of its parent.
 */
export const Skeleton = ({ as: Component = 'div' }: SkeletonProps) => {
  return <Component className={cn('w-full h-full bg-shimmer rounded-xs')} />;
};
