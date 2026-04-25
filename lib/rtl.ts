import { I18nManager, type FlexStyle, type TextStyle } from 'react-native';

import { isRtlLanguage } from '@/lib/i18n';

export type RtlLayout = {
  isRtl: boolean;
  leadingAlignItems: FlexStyle['alignItems'];
  rowDirection: FlexStyle['flexDirection'];
  textAlign: TextStyle['textAlign'];
  trailingAlignItems: FlexStyle['alignItems'];
};

export function getRtlLayout(language?: string): RtlLayout {
  const isRtl = language != null ? isRtlLanguage(language) : I18nManager.isRTL;

  return {
    isRtl,
    leadingAlignItems: isRtl ? 'flex-end' : 'flex-start',
    rowDirection: isRtl ? 'row-reverse' : 'row',
    textAlign: isRtl ? 'right' : 'left',
    trailingAlignItems: isRtl ? 'flex-start' : 'flex-end',
  };
}
