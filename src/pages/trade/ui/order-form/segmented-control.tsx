import React from 'react';
import styled from 'styled-components';
import { Direction } from './order-form-store';
import { theme } from '@penumbra-zone/ui/PenumbraUIProvider';

const getToggleColor = (props: { $isBuy: boolean; theme: typeof theme }) =>
  props.$isBuy ? props.theme.color.success.main : props.theme.color.destructive.main;

const Wrapper = styled.div`
  display: flex;
  width: 100%;
  height: 32px;
  margin-bottom: ${props => props.theme.spacing(4)};
`;

const ToggleButton = styled.button<{ $active: boolean; $isBuy: boolean; theme: typeof theme }>`
  flex: 1;
  background: ${props => (props.$active ? getToggleColor(props) : 'transparent')};
  border: 1px solid
    ${props => (props.$active ? getToggleColor(props) : props.theme.color.other.tonalStroke)};
  border-right-width: ${props => (props.$isBuy ? 0 : '1px')};
  border-left-width: ${props => (props.$isBuy ? '1px' : 0)};
  color: ${props =>
    props.$active ? props.theme.color.text.primary : props.theme.color.text.secondary};
  cursor: pointer;
  transition:
    color 0.3s,
    background-color 0.3s;
  border-radius: ${props => (props.$isBuy ? '16px 0 0 16px' : '0 16px 16px 0')};

  &:focus {
    outline: none;
  }
`;

export const SegmentedControl: React.FC<{
  direction: Direction;
  setDirection: (direction: Direction) => void;
}> = ({ direction, setDirection }) => {
  return (
    <Wrapper>
      <ToggleButton
        $active={direction === Direction.Buy}
        $isBuy={true}
        onClick={() => setDirection(Direction.Buy)}
      >
        Buy
      </ToggleButton>
      <ToggleButton
        $active={direction === Direction.Sell}
        $isBuy={false}
        onClick={() => setDirection(Direction.Sell)}
      >
        Sell
      </ToggleButton>
    </Wrapper>
  );
};
