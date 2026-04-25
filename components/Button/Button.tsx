import type { ReactNode } from 'react';
import { Button as TamaguiButton, Text, styled } from 'tamagui';
import type { GetProps } from 'tamagui';

const ButtonFrame = styled(TamaguiButton, {
  alignItems: 'center',
  backgroundColor: '$primary',
  borderCurve: 'continuous',
  borderRadius: '$4',
  borderWidth: 0,
  gap: '$2',
  justifyContent: 'center',
  minHeight: '$5',
  name: 'Button',
  paddingHorizontal: '$4',
  pressStyle: {
    backgroundColor: '$primaryPress',
    opacity: 0.92,
  },
});

const ButtonLabel = styled(Text, {
  color: '$inverseColor',
  fontFamily: '$body',
  fontSize: '$4',
  fontWeight: '700',
  name: 'ButtonText',
});

export type ButtonProps = GetProps<typeof ButtonFrame>;

export function Button(props: ButtonProps) {
  return <ButtonFrame {...props} />;
}

export function ButtonText({ children }: { children: ReactNode }) {
  return <ButtonLabel>{children}</ButtonLabel>;
}

export function ButtonIcon({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
