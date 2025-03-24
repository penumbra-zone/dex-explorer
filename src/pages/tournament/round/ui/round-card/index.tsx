import { observer } from 'mobx-react-lite';
import { GradientCard } from '../../../ui/shared/gradient-card';

export const RoundCard = observer(() => {
  const epoch = 123;

  return (
    <GradientCard>
      <div className='flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-12 p-4 md:p-6 lg:p-12'>
        asd
        <div className='w-full h-[1px] md:w-[1px] md:h-auto bg-other-tonalStroke flex-shrink-0' />
        asd
      </div>
    </GradientCard>
  );
});
