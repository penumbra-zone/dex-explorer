'use client';

import { ExploreStats } from './stats';
import { ExplorePairs } from './pairs';
import PenumbraWaves from './penumbra-waves.svg';

export const ExplorePage = () => {
  return (
    <section className='flex flex-col gap-6 p-4 max-w-[1062px] mx-auto'>
      <PenumbraWaves className='w-screen h-[100vw] -translate-y-[70%] scale-150 fixed -z-[1] pointer-events-none top-0 left-0 desktop:scale-100 desktop:w-[80vw] desktop:h-[80vw] desktop:-translate-y-3/4 desktop:left-[10vw]' />
      <ExploreStats />
      <ExplorePairs />
    </section>
  );
};
