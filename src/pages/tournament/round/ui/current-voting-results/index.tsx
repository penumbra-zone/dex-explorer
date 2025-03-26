import { Card } from '@penumbra-zone/ui/Card';
import { Text } from '@penumbra-zone/ui/Text';
import { TableCell } from '@penumbra-zone/ui/TableCell';
import { Density } from '@penumbra-zone/ui/Density';
import { Skeleton } from '@/shared/ui/skeleton';

export const CurrentVotingResults = () => {
  return (
    <Card>
      <div className='flex flex-col p-3 gap-4'>
        <Text xxl color='text.primary'>
          Current Voting Results
        </Text>
        <Density compact>
          <div className='grid grid-cols-5 h-auto overflow-auto'>
            <div className='grid grid-cols-subgrid col-span-5'>
              <TableCell heading>Asset</TableCell>
              <TableCell heading>Gauge Value</TableCell>
              <TableCell heading>Casted Votes</TableCell>
              <TableCell heading>Estimated Incentive</TableCell>
              <TableCell heading>Vote</TableCell>
            </div>

            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='grid grid-cols-subgrid col-span-5'>
                <TableCell loading>
                  <div className='flex items-center gap-2'>
                    <div className='w-6 h-6 rounded-full overflow-hidden'>
                      <Skeleton />
                    </div>
                    <div className='w-20 h-5'>
                      <Skeleton />
                    </div>
                  </div>
                </TableCell>
                <TableCell loading>
                  <div className='w-24 h-5'>
                    <Skeleton />
                  </div>
                </TableCell>
                <TableCell loading>
                  <div className='w-24 h-5'>
                    <Skeleton />
                  </div>
                </TableCell>
                <TableCell loading>
                  <div className='w-24 h-5'>
                    <Skeleton />
                  </div>
                </TableCell>
                <TableCell loading>
                  <div className='w-24 h-5'>
                    <Skeleton />
                  </div>
                </TableCell>
              </div>
            ))}
          </div>
        </Density>
      </div>
    </Card>
  );
};
