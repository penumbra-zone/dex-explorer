import { observer } from 'mobx-react-lite';
import { Text } from '@penumbra-zone/ui/Text';
import { Icon } from '@penumbra-zone/ui/Icon';
import { Tooltip } from '@penumbra-zone/ui/Tooltip';
import { InfoIcon } from 'lucide-react';

interface InfoRowProps {
  label: string;
  isLoading?: boolean;
  value: string;
  valueColor?: 'success' | 'error';
  toolTip: string;
}

export const InfoRow = observer(
  ({ label, isLoading, value, valueColor, toolTip }: InfoRowProps) => {
    return (
      <div className='flex justify-between mb-1 last:mb-0'>
        <Text small color={color => color.text.secondary}>
          {label}
        </Text>
        <div className='flex items-center'>
          <div className='mr-1'>
            <Text small color={color => color.text.secondary}>
              {value}
            </Text>
          </div>
          <Tooltip message={toolTip}>
            <Icon IconComponent={InfoIcon} size='sm' color={color => color.text.primary} />
          </Tooltip>
        </div>
      </div>
    );
  },
);
