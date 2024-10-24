/* eslint-disable no-nested-ternary */
import React, { useState } from 'react';
import styled from 'styled-components';

const getToggleColor = props =>
  props.isBuy ? props.theme.color.success.main : props.theme.color.destructive.main;

const Wrapper = styled.div`
  display: flex;
  width: 100%;
  height: 32px;
  margin-bottom: ${props => props.theme.spacing(4)};
`;

const ToggleButton = styled.button<{ active: boolean; isBuy: boolean }>`
  flex: 1;
  background: ${props => (props.active ? getToggleColor(props) : 'transparent')};
  border: 1px solid
    ${props => (props.active ? getToggleColor(props) : props.theme.color.other.tonalStroke)};
  border-right-width: ${props => (props.isBuy ? 0 : '1px')};
  border-left-width: ${props => (props.isBuy ? '1px' : 0)};
  color: ${props =>
    props.active ? props.theme.color.text.primary : props.theme.color.text.secondary};
  cursor: pointer;
  transition:
    color 0.3s,
    background-color 0.3s;
  border-radius: ${props => (props.isBuy ? '16px 0 0 16px' : '0 16px 16px 0')};

  &:focus {
    outline: none;
  }
`;

const SegmentedControl: React.FC = () => {
  const [active, setActive] = useState<'buy' | 'sell'>('buy');

  return (
    <Wrapper>
      <ToggleButton active={active === 'buy'} isBuy={true} onClick={() => setActive('buy')}>
        Buy
      </ToggleButton>
      <ToggleButton active={active === 'sell'} isBuy={false} onClick={() => setActive('sell')}>
        Sell
      </ToggleButton>
    </Wrapper>
  );
};

export default SegmentedControl;
