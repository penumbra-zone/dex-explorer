import { observer } from 'mobx-react-lite';
import { Button } from '@penumbra-zone/ui/Button';
import { Text } from '@penumbra-zone/ui/Text';
import {
  PositionId,
  PositionState_PositionStateEnum,
} from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { positionsStore } from '@/pages/trade/model/positions';

export const ActionButton = observer(
  ({ state, id }: { state: PositionState_PositionStateEnum; id: PositionId }) => {
    const { loading, closePositions, withdrawPositions } = positionsStore;

    if (state === PositionState_PositionStateEnum.OPENED) {
      return (
        <Button density='slim' onClick={() => void closePositions([id])} disabled={loading}>
          Close
        </Button>
      );
    } else if (state === PositionState_PositionStateEnum.CLOSED) {
      return (
        <Button density='slim' disabled={loading} onClick={() => void withdrawPositions([id])}>
          Withdraw
        </Button>
      );
    } else {
      return (
        <Text detail color='text.secondary'>
          -
        </Text>
      );
    }
  },
);
