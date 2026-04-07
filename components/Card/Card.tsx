import { YStack, styled } from 'tamagui';

export const Card = styled(YStack, {
  backgroundColor: '$card',
  borderColor: '$borderColor',
  borderRadius: '$5',
  borderWidth: 1,
  gap: '$3',
  name: 'Card',
  padding: '$4',
  shadowColor: '$shadowColor',
  shadowOffset: {
    height: 10,
    width: 0,
  },
  shadowOpacity: 0.14,
  shadowRadius: 20,
});
