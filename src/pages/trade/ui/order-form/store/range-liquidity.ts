import { makeAutoObservable } from 'mobx';

export class RangeLiquidity {
  upperBound?: number;
  lowerBound?: number;
  feeTier?: number;
  positions?: number;

  constructor() {
    makeAutoObservable(this);
  }

  setUpperBound = (amount: string) => {
    const nextUpperBound = Number(amount);

    if (nextUpperBound > (this.lowerBound ?? 0)) {
      this.upperBound = nextUpperBound;
    }
  };

  setLowerBound = (amount: string) => {
    const nextLowerBound = Number(amount);

    if (nextLowerBound < (this.upperBound ?? 0)) {
      this.lowerBound = nextLowerBound;
    }
  };

  setFeeTier = (feeTier: string) => {
    this.feeTier = Number(feeTier);
  };

  setPositions = (positions: string) => {
    this.positions = Number(positions);
  };
}
