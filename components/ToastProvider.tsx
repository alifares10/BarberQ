import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/Text/Text';
import { getRtlLayout } from '@/lib/rtl';

type ToastType = 'error' | 'info' | 'success';

type ToastOptions = {
  message: string;
  type: ToastType;
};

type ToastState = ToastOptions & {
  id: number;
};

type ToastContextValue = {
  showToast: (options: ToastOptions) => void;
};

const TOAST_DURATION_MS = 3200;
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const { i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const rtlLayout = getRtlLayout(i18n.language);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((options: ToastOptions) => {
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current);
    }

    setToast({
      ...options,
      id: Date.now(),
    });

    timeoutRef.current = setTimeout(() => {
      setToast(null);
      timeoutRef.current = null;
    }, TOAST_DURATION_MS);
  }, []);

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current != null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <ToastContext.Provider value={contextValue}>
      <View style={styles.root}>
        {children}

        <View pointerEvents="none" style={[styles.overlay, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
          {toast != null ? (
            <View
              key={toast.id}
              style={[
                styles.toast,
                toast.type === 'success' ? styles.successToast : null,
                toast.type === 'error' ? styles.errorToast : null,
                toast.type === 'info' ? styles.infoToast : null,
              ]}
            >
              <Text color="$inverseColor" fontWeight="700" textAlign={rtlLayout.textAlign}>
                {toast.message}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (context == null) {
    throw new Error('useToast must be used inside ToastProvider');
  }

  return context;
}

const styles = StyleSheet.create({
  errorToast: {
    backgroundColor: '#dc2626',
  },
  infoToast: {
    backgroundColor: '#1d4ed8',
  },
  overlay: {
    bottom: 0,
    left: 0,
    paddingHorizontal: 16,
    position: 'absolute',
    right: 0,
    zIndex: 1000,
  },
  root: {
    flex: 1,
  },
  successToast: {
    backgroundColor: '#15803d',
  },
  toast: {
    borderCurve: 'continuous',
    borderRadius: 14,
    boxShadow: '0px 10px 30px rgba(15, 23, 42, 0.24)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
