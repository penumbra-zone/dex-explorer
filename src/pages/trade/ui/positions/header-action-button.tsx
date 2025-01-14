import { observer } from 'mobx-react-lite';
import { Button } from '@penumbra-zone/ui/Button';
import { PositionState_PositionStateEnum } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { positionsStore, DisplayPosition } from '@/pages/trade/model/positions';

const MAX_ACTION_COUNT = 15;

export const HeaderActionButton = observer(
  ({ displayPositions }: { displayPositions: DisplayPosition[] }) => {
    const { loading, closePositions, withdrawPositions } = positionsStore;

    const openedPositions = displayPositions.filter(
      position => position.state === PositionState_PositionStateEnum.OPENED,
    );

    if (openedPositions.length > 1) {
      return (
        <Button
          density='slim'
          actionType='destructive'
          disabled={loading}
          onClick={() =>
            void closePositions(
              openedPositions.slice(0, MAX_ACTION_COUNT).map(position => position.id),
            )
          }
        >
          Close Batch
        </Button>
      );
    }

    const closedPositions = displayPositions.filter(
      position => position.state === PositionState_PositionStateEnum.CLOSED,
    );

    if (closedPositions.length > 1) {
      return (
        <Button
          density='slim'
          actionType='destructive'
          disabled={loading}
          onClick={() =>
            void withdrawPositions(
              closedPositions.map(position => position.id).slice(0, MAX_ACTION_COUNT),
            )
          }
        >
          Withdraw Batch
        </Button>
      );
    }

    return 'Actions';
  },
);
