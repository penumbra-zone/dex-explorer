import { styled } from 'styled-components';
import { small, large } from './utils';
import { forwardRef, useId } from 'react';

const Wrapper = styled.div`
  position: relative;
  height: 64px;
  background: ${props =>
    `linear-gradient(to right, ${props.theme.color.other.tonalFill5}, ${props.theme.color.other.tonalFill10})`};
  border-radius: ${props => props.theme.borderRadius.sm};
  margin-bottom: ${props => props.theme.spacing(4)};
`;

const StyledLabel = styled.label`
  position: absolute;
  top: ${props => props.theme.spacing(2)};
  left: ${props => props.theme.spacing(3)};
  z-index: 1;
  ${small};
  color: ${props => props.theme.color.text.secondary};
`;

const Denominator = styled.div`
  position: absolute;
  top: 0;
  right: ${props => props.theme.spacing(3)};
  pointer-events: none;
  z-index: 1;
  ${small};
  color: ${props => props.theme.color.text.secondary};
  line-height: 64px;
`;

const StyledInput = styled.input<{ $isApproximately: boolean }>`
  width: 100%;
  appearance: none;
  border: none;
  background: transparent;
  color: ${props => props.theme.color.text.primary};
  transition: border-color 0.15s;
  padding: ${props => props.theme.spacing(2)} ${props => props.theme.spacing(3)};
  padding-top: 28px;
  ${large};

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &[type='number'] {
    -moz-appearance: textfield;
  }

  &:focus {
    outline: none;
  }
`;

export interface OrderInputProps {
  label: string;
  value: number;
  placeholder?: string;
  isEstimating: boolean;
  isApproximately: boolean;
  onChange: (value: string) => void;
  denominator: string;
  max?: string | number;
  min?: string | number;
}

/**
 * A simple text field.
 *
 * Can be enriched with start and end adornments, which are markup that render
 * inside the text input's visual frame.
 */
// eslint-disable-next-line react/display-name -- exotic component
export const OrderInput = forwardRef<HTMLInputElement, OrderInputProps>(
  (
    {
      id: idProp,
      label,
      value,
      placeholder,
      isEstimating,
      isApproximately,
      onChange,
      denominator,
      max,
      min,
    }: OrderInputProps,
    ref,
  ) => {
    const reactId = useId();
    const id = idProp ?? reactId;

    return (
      <Wrapper>
        <StyledLabel htmlFor={id}>{label}</StyledLabel>
        <StyledInput
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          type='number'
          max={max}
          min={min}
          ref={ref}
          id={id}
          $isApproximately={isApproximately}
        />
        <Denominator>{denominator}</Denominator>
      </Wrapper>
    );
  },
);
