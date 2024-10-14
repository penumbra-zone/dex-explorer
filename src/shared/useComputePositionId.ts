import { useEffect, useState, useRef } from 'react';
import {
  Position,
  PositionId,
} from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';

export function useComputePositionId() {
  const ref = useRef<(position: Position) => PositionId>();
  const [, setIsSet] = useState(false);

  useEffect(() => {
    const set = async () => {
      // cant import directly without breaking the build cmd
      const { computePositionId } = await import('@penumbra-zone/wasm/dex');

      // function cannot be store in state, so we store it in a ref
      ref.current = computePositionId;

      // trigger re-render
      setIsSet(true);
    };

    void set();
  }, []);

  return ref.current;
}
