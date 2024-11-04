import { observer } from 'mobx-react-lite';
import { Text } from '@penumbra-zone/ui/Text';
import { Icon } from '@penumbra-zone/ui/Icon';
import { Tooltip } from '@penumbra-zone/ui/Tooltip';
import { theme } from '@penumbra-zone/ui/PenumbraUIProvider';
import { InfoIcon } from 'lucide-react';

interface InfoRowProps {
  label: string;
  isLoading?: boolean;
  value: string;
  valueColor?: 'success' | 'error';
  toolTip: string;
}

const getValueColor = (valueColor: InfoRowProps['valueColor']) => (color: typeof theme.color) => {
  if (valueColor === 'success') {
    return color.success.light;
  }
  if (valueColor === 'error') {
    return color.destructive.main;
  }
  return color.text.secondary;
};

export const InfoRow = observer(
  ({ label, isLoading, value, valueColor, toolTip }: InfoRowProps) => {
    return (
      <div className='flex justify-between mb-1 last:mb-0'>
        <Text small color={color => color.text.secondary}>
          {label}
        </Text>
        <div className='flex items-center'>
          <div className='mr-1'>
            {isLoading ? (
              <div className='w-16 h-4 bg-neutral-main rounded-xs animate-pulse' />
            ) : (
              <Text small color={getValueColor(valueColor)}>
                {value}
              </Text>
            )}
          </div>
          <Tooltip message={toolTip}>
            <Icon IconComponent={InfoIcon} size='sm' color={color => color.text.primary} />
          </Tooltip>
        </div>
      </div>
    );
  },
);
