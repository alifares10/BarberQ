import { I18nManager } from 'react-native';
import { Input as TamaguiInput } from 'tamagui';
import type { GetProps } from 'tamagui';

type InputProps = GetProps<typeof TamaguiInput>;

export function Input(props: InputProps) {
  return (
    <TamaguiInput
      backgroundColor="$background"
      borderColor="$borderColor"
      borderCurve="continuous"
      borderRadius="$4"
      borderWidth={1}
      color="$color"
      focusStyle={{ borderColor: '$accent' }}
      minHeight="$5"
      paddingHorizontal="$4"
      placeholderTextColor="$placeholderColor"
      textAlign={I18nManager.isRTL ? 'right' : 'left'}
      {...props}
    />
  );
}
