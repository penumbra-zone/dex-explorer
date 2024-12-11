import { makeAutoObservable } from 'mobx';
import { Pair, getStarredPairs, setStarredPairs } from './storage';

class StarStateStore {
  pairs: Pair[] = [];

  constructor() {
    makeAutoObservable(this);

    if (typeof window !== 'undefined') {
      this.setup();
    }
  }

  star = (pair: Pair) => {
    this.pairs = [...this.pairs, pair];
    setStarredPairs(this.pairs);
  }

  unstar = (pair: Pair) => {
    this.pairs = this.pairs.filter((value) => !value.base.equals(pair.base) || !value.quote.equals(pair.quote));
    setStarredPairs(this.pairs);
  }

  setup () {
    this.pairs = getStarredPairs();
  }

  isStarred = (pair: Pair): boolean => {
    return this.pairs.some((value) => value.base.equals(pair.base) && value.quote.equals(pair.quote));
  }
}

export const starStore = new StarStateStore();
