import { FlashList } from '@shopify/flash-list';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, ButtonText } from '@/components/Button/Button';
import { Card } from '@/components/Card/Card';
import { Input } from '@/components/Input/Input';
import { Text } from '@/components/Text/Text';
import {
  createShopClosure,
  deleteShopClosure,
  fetchShopClosures,
  updateShopClosure,
} from '@/lib/shop-owner/api';
import { shopOwnerQueryKeys } from '@/lib/shop-owner/query-keys';
import type { Database } from '@/types/database';

type ShopClosure = Database['public']['Tables']['shop_closures']['Row'];

type ShopClosuresCardProps = {
  shopId: string | null;
};

function isUniqueViolation(error: unknown) {
  if (typeof error !== 'object' || error == null || !('code' in error)) {
    return false;
  }

  return (error as { code?: string }).code === '23505';
}

function isValidDateInput(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function ShopClosuresCard({ shopId }: ShopClosuresCardProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isModalVisible, setModalVisible] = useState(false);
  const [closureId, setClosureId] = useState<string | null>(null);
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const closuresQuery = useQuery({
    enabled: shopId != null,
    queryFn: () => fetchShopClosures(shopId ?? ''),
    queryKey: shopId != null ? shopOwnerQueryKeys.shopClosuresByShop(shopId) : ['shop-owner', 'shop-closures', 'unknown'],
  });
  const saveClosureMutation = useMutation({
    mutationFn: async () => {
      if (shopId == null) {
        throw new Error(t('shopOwner.shopClosures.errors.missingShop'));
      }

      if (!isValidDateInput(date)) {
        throw new Error(t('shopOwner.shopClosures.errors.invalidDate'));
      }

      const trimmedReason = reason.trim();

      if (closureId == null) {
        return createShopClosure({
          date,
          reason: trimmedReason.length === 0 ? null : trimmedReason,
          shop_id: shopId,
        });
      }

      return updateShopClosure(closureId, {
        date,
        reason: trimmedReason.length === 0 ? null : trimmedReason,
      });
    },
    onSuccess: () => {
      if (shopId != null) {
        void queryClient.invalidateQueries({ queryKey: shopOwnerQueryKeys.shopClosuresByShop(shopId) });
      }

      setClosureId(null);
      setDate('');
      setReason('');
      setErrorMessage(null);
    },
  });
  const deleteClosureMutation = useMutation({
    mutationFn: (id: string) => deleteShopClosure(id),
    onSuccess: () => {
      if (shopId != null) {
        void queryClient.invalidateQueries({ queryKey: shopOwnerQueryKeys.shopClosuresByShop(shopId) });
      }
    },
  });

  const closures = useMemo(() => closuresQuery.data ?? [], [closuresQuery.data]);

  const handleRetryLoad = useCallback(async () => {
    await closuresQuery.refetch();
  }, [closuresQuery]);

  const handleClose = () => {
    setClosureId(null);
    setDate('');
    setReason('');
    setErrorMessage(null);
    setModalVisible(false);
  };

  const handleSave = async () => {
    try {
      await saveClosureMutation.mutateAsync();
    } catch (error) {
      if (isUniqueViolation(error)) {
        setErrorMessage(t('shopOwner.shopClosures.errors.duplicateDate'));
        return;
      }

      const message = error instanceof Error ? error.message : t('shopOwner.shopClosures.errors.generic');
      setErrorMessage(message);
    }
  };

  const handleEdit = useCallback((item: ShopClosure) => {
    setErrorMessage(null);
    setClosureId(item.id);
    setDate(item.date);
    setReason(item.reason ?? '');
  }, []);

  const handleDelete = useCallback((id: string) => {
    void deleteClosureMutation.mutateAsync(id);
  }, [deleteClosureMutation]);

  const renderClosureItem = useCallback(
    ({ item }: { item: ShopClosure }) => (
      <Card>
        <Text fontWeight="700">{item.date}</Text>
        <Text color="$colorMuted">
          {item.reason == null || item.reason.length === 0
            ? t('shopOwner.shopClosures.noReason')
            : item.reason}
        </Text>

        <View style={styles.actionRow}>
          <Button onPress={() => handleEdit(item)}>
            <ButtonText>{t('shopOwner.shopClosures.actions.edit')}</ButtonText>
          </Button>
          <Button onPress={() => handleDelete(item.id)}>
            <ButtonText>{t('shopOwner.shopClosures.actions.delete')}</ButtonText>
          </Button>
        </View>
      </Card>
    ),
    [handleDelete, handleEdit, t]
  );

  return (
    <>
      <Card>
        <Text fontWeight="700">{t('shopOwner.shopClosures.cardTitle')}</Text>
        <Text color="$colorMuted">{t('shopOwner.shopClosures.cardDescription')}</Text>

        {shopId == null ? (
          <Text color="$colorMuted">{t('shopOwner.shopClosures.requiresShop')}</Text>
        ) : closuresQuery.isError ? (
          <>
            <Text color="$error">{t('shopOwner.shopClosures.loadError')}</Text>
            <Button onPress={() => void handleRetryLoad()}>
              <ButtonText>{t('shopOwner.shopClosures.retryButton')}</ButtonText>
            </Button>
          </>
        ) : closuresQuery.isPending ? (
          <Text color="$colorMuted">{t('shopOwner.shopClosures.loadingData')}</Text>
        ) : (
          <Button onPress={() => setModalVisible(true)}>
            <ButtonText>{t('shopOwner.shopClosures.manageButton')}</ButtonText>
          </Button>
        )}
      </Card>

      <Modal animationType="slide" presentationStyle="formSheet" visible={isModalVisible} onRequestClose={handleClose}>
        <View style={styles.modalRoot}>
          <Text fontFamily="$heading" fontSize={24} fontWeight="800" lineHeight={30}>
            {t('shopOwner.shopClosures.title')}
          </Text>
          <Text color="$colorMuted">{t('shopOwner.shopClosures.description')}</Text>

          <View style={styles.fieldGroup}>
            <Text fontWeight="700">{t('shopOwner.shopClosures.dateLabel')}</Text>
            <Input
              autoCapitalize="none"
              onChangeText={setDate}
              placeholder={t('shopOwner.shopClosures.datePlaceholder')}
              value={date}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text fontWeight="700">{t('shopOwner.shopClosures.reasonLabel')}</Text>
            <Input
              autoCapitalize="sentences"
              onChangeText={setReason}
              placeholder={t('shopOwner.shopClosures.reasonPlaceholder')}
              value={reason}
            />
          </View>

          {errorMessage != null ? <Text color="$error">{errorMessage}</Text> : null}

          <View style={styles.actionRow}>
            <Button onPress={() => void handleSave()}>
              <ButtonText>
                {saveClosureMutation.isPending
                  ? t('shopOwner.shopClosures.savingButton')
                  : t('shopOwner.shopClosures.actions.save')}
              </ButtonText>
            </Button>
            <Button
              onPress={() => {
                setClosureId(null);
                setDate('');
                setReason('');
                setErrorMessage(null);
              }}
            >
              <ButtonText>{t('shopOwner.shopClosures.actions.clearForm')}</ButtonText>
            </Button>
            <Button onPress={handleClose}>
              <ButtonText>{t('shopOwner.shopClosures.actions.close')}</ButtonText>
            </Button>
          </View>

          {closuresQuery.isError ? (
            <Card>
              <Text color="$error">{t('shopOwner.shopClosures.loadError')}</Text>
              <Button onPress={() => void handleRetryLoad()}>
                <ButtonText>{t('shopOwner.shopClosures.retryButton')}</ButtonText>
              </Button>
            </Card>
          ) : closuresQuery.isPending ? (
            <Card>
              <Text color="$colorMuted">{t('shopOwner.shopClosures.loadingData')}</Text>
            </Card>
          ) : (
            <FlashList
              ListEmptyComponent={
                <Card>
                  <Text color="$colorMuted">{t('shopOwner.shopClosures.empty')}</Text>
                </Card>
              }
              contentContainerStyle={styles.listContent}
              data={closures}

              keyExtractor={(item) => item.id}
              renderItem={renderClosureItem}
              style={styles.listViewport}
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fieldGroup: {
    gap: 8,
  },
  listContent: {
    gap: 8,
    paddingBottom: 12,
  },
  listViewport: {
    maxHeight: 320,
  },
  modalRoot: {
    flex: 1,
    gap: 12,
    padding: 16,
  },
});
