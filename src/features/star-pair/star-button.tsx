import { observer } from 'mobx-react-lite';
import { Star } from 'lucide-react';
import { Button } from '@penumbra-zone/ui/Button';
import { Density } from '@penumbra-zone/ui/Density';
import StarFilled from './star-filled.svg';
import type { Pair } from './storage';
import { starStore } from './store';

export interface StarButtonProps {
  pair: Pair;
}

export const StarButton = observer(({ pair }: StarButtonProps) => {
  const { star, unstar, isStarred } = starStore;
  const starred = isStarred(pair);

  const onClick = () => {
    if (starred) {
      unstar(pair);
    } else {
      star(pair);
    }
  };

  return (
    <Density compact>
      <Button icon={starred ? StarFilled : Star} priority='secondary' iconOnly onClick={onClick}>
        Favorite
      </Button>
    </Density>
  );
});
