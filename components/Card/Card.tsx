import { YStack, styled } from 'tamagui';

export const Card = styled(YStack, {
  backgroundColor: '$card',
  borderColor: '$borderColor',
  borderCurve: 'continuous',
  borderRadius: '$5',
  borderWidth: 1,
  boxShadow: '0px 10px 20px rgba(15, 23, 42, 0.14)',
  gap: '$3',
  name: 'Card',
  padding: '$4',
});
