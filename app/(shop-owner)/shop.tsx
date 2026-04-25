import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, ButtonText, Card, Input, LoadingScreen, ShopClosuresCard, StateCard, Text, useToast } from '@/components';
import { getRtlLayout } from '@/lib/rtl';
import { createShop, fetchShopByOwnerId, updateShop, uploadShopCoverImage } from '@/lib/shop-owner/api';
import { geocodeAddress } from '@/lib/shop-owner/geocoding';
import { shopOwnerQueryKeys } from '@/lib/shop-owner/query-keys';
import { useAuthStore } from '@/stores/auth-store';

type ShopFormState = {
  address: string;
  bufferMinutes: string;
  cancellationWindowHours: string;
  description: string;
  name: string;
  phone: string;
};

type PendingPickedImage = {
  base64: string;
  mimeType: string | null;
  uri: string;
};

const DEFAULT_FORM_STATE: ShopFormState = {
  address: '',
  bufferMinutes: '0',
  cancellationWindowHours: '',
  description: '',
  name: '',
  phone: '',
};

export default function ShopManagementScreen() {
  const { i18n, t } = useTranslation();
  const { showToast } = useToast();
  const rtlLayout = getRtlLayout(i18n.language);
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const ownerId = session?.user.id ?? null;
  const [form, setForm] = useState<ShopFormState>(DEFAULT_FORM_STATE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingCoverImage, setPendingCoverImage] = useState<PendingPickedImage | null>(null);
  const shopQuery = useQuery({
    enabled: ownerId != null,
    queryFn: () => fetchShopByOwnerId(ownerId ?? ''),
    queryKey: ownerId != null ? shopOwnerQueryKeys.shopByOwner(ownerId) : ['shop-owner', 'shop', 'unknown'],
  });
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (ownerId == null) {
        throw new Error(t('shopOwner.shopManagement.errors.missingSession'));
      }

      const name = form.name.trim();
      const address = form.address.trim();
      const phone = form.phone.trim();

      if (name.length === 0 || address.length === 0 || phone.length === 0) {
        throw new Error(t('shopOwner.shopManagement.errors.requiredFields'));
      }

      const bufferMinutes = Number.parseInt(form.bufferMinutes, 10);

      if (!Number.isInteger(bufferMinutes) || bufferMinutes < 0) {
        throw new Error(t('shopOwner.shopManagement.errors.invalidBuffer'));
      }

      const cancellationRawValue = form.cancellationWindowHours.trim();
      const cancellationWindowHours =
        cancellationRawValue.length === 0 ? null : Number.parseInt(cancellationRawValue, 10);

      if (
        cancellationWindowHours != null &&
        (!Number.isInteger(cancellationWindowHours) || cancellationWindowHours < 0)
      ) {
        throw new Error(t('shopOwner.shopManagement.errors.invalidCancellationWindow'));
      }

      const existingShop = shopQuery.data;
      const isAddressChanged = existingShop == null || existingShop.address !== address;
      const geocoded =
        isAddressChanged || existingShop == null
          ? await geocodeAddress(address)
          : {
              latitude: existingShop.latitude,
              longitude: existingShop.longitude,
              normalizedAddress: address,
            };

      const payload = {
        address: geocoded.normalizedAddress,
        buffer_minutes: bufferMinutes,
        cancellation_window_hours: cancellationWindowHours,
        description: form.description.trim().length === 0 ? null : form.description.trim(),
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
        name,
        phone,
      };

      const savedShop =
        existingShop == null
          ? await createShop({
              ...payload,
              owner_id: ownerId,
            })
          : await updateShop(existingShop.id, payload);

      if (pendingCoverImage == null) {
        return savedShop;
      }

      const coverImageUrl = await uploadShopCoverImage({
        base64Data: pendingCoverImage.base64,
        fileUri: pendingCoverImage.uri,
        mimeType: pendingCoverImage.mimeType,
        ownerId,
        shopId: savedShop.id,
      });

      return updateShop(savedShop.id, {
        cover_image_url: coverImageUrl,
      });
    },
    onSuccess: (shop) => {
      if (ownerId != null) {
        queryClient.setQueryData(shopOwnerQueryKeys.shopByOwner(ownerId), shop);
      }

      setPendingCoverImage(null);
      setErrorMessage(null);
      showToast({ message: t('toast.shopSaved'), type: 'success' });
    },
  });

  useEffect(() => {
    const shop = shopQuery.data;

    if (shop == null) {
      setForm(DEFAULT_FORM_STATE);
      setPendingCoverImage(null);
      return;
    }

    setForm({
      address: shop.address,
      bufferMinutes: String(shop.buffer_minutes),
      cancellationWindowHours:
        shop.cancellation_window_hours == null ? '' : String(shop.cancellation_window_hours),
      description: shop.description ?? '',
      name: shop.name,
      phone: shop.phone,
    });
    setPendingCoverImage(null);
  }, [shopQuery.data]);

  const handlePickCoverImage = async () => {
    setErrorMessage(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setErrorMessage(t('shopOwner.shopManagement.errors.mediaPermission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      base64: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    const selectedAsset = result.assets[0];

    if (selectedAsset == null) {
      setErrorMessage(t('shopOwner.shopManagement.errors.imageSelectionFailed'));
      return;
    }

    if (selectedAsset.base64 == null || selectedAsset.base64.length === 0) {
      setErrorMessage(t('shopOwner.shopManagement.errors.imageSelectionFailed'));
      return;
    }

    setPendingCoverImage({
      base64: selectedAsset.base64,
      mimeType: selectedAsset.mimeType ?? null,
      uri: selectedAsset.uri,
    });
  };

  const handleChange = (key: keyof ShopFormState, value: string) => {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('shopOwner.shopManagement.errors.generic');

      setErrorMessage(message);
      showToast({ message: t('toast.shopSaveFailed'), type: 'error' });
    }
  };

  if (shopQuery.isPending) {
    return <LoadingScreen />;
  }

  if (shopQuery.isError && shopQuery.data == null) {
    return (
      <View style={styles.errorScreen}>
        <StateCard
          actionLabel={t('shopOwner.shopManagement.retryButton')}
          description={t('shopOwner.shopManagement.loadError')}
          onAction={() => void shopQuery.refetch()}
          variant="error"
        />
      </View>
    );
  }

  const currentCoverImage = pendingCoverImage?.uri ?? shopQuery.data?.cover_image_url ?? null;
  const isSaving = saveMutation.isPending;
  const hasExistingShop = shopQuery.data != null;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.contentContainer}>
      <View style={styles.container}>
        <Card>
          <Text fontFamily="$heading" fontSize={28} fontWeight="800" lineHeight={34} textAlign={rtlLayout.textAlign}>
            {t('shopOwner.shopManagement.title')}
          </Text>
          <Text color="$colorMuted" textAlign={rtlLayout.textAlign}>{t('shopOwner.shopManagement.description')}</Text>
        </Card>

        {shopQuery.isError ? (
          <StateCard
            actionLabel={t('shopOwner.shopManagement.retryButton')}
            description={t('shopOwner.shopManagement.loadError')}
            onAction={() => void shopQuery.refetch()}
            variant="error"
          />
        ) : null}

        <Card>
          <View style={styles.fieldGroup}>
            <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{t('shopOwner.shopManagement.coverLabel')}</Text>
            {currentCoverImage != null ? (
              <Image source={{ uri: currentCoverImage }} style={styles.coverImage} contentFit="cover" />
            ) : (
              <View style={styles.coverPlaceholder}>
                <Text color="$colorMuted" textAlign="center">{t('shopOwner.shopManagement.coverPlaceholder')}</Text>
              </View>
            )}
            <Button onPress={() => void handlePickCoverImage()} disabled={isSaving}>
              <ButtonText>{t('shopOwner.shopManagement.chooseCoverButton')}</ButtonText>
            </Button>
          </View>
        </Card>

        <Card>
          <View style={styles.fieldGroup}>
            <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{t('shopOwner.shopManagement.nameLabel')}</Text>
            <Input
              autoCapitalize="words"
              onChangeText={(value) => handleChange('name', value)}
              placeholder={t('shopOwner.shopManagement.namePlaceholder')}
              value={form.name}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{t('shopOwner.shopManagement.addressLabel')}</Text>
            <Input
              autoCapitalize="words"
              onChangeText={(value) => handleChange('address', value)}
              placeholder={t('shopOwner.shopManagement.addressPlaceholder')}
              value={form.address}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{t('shopOwner.shopManagement.phoneLabel')}</Text>
            <Input
              autoCapitalize="none"
              keyboardType="phone-pad"
              onChangeText={(value) => handleChange('phone', value)}
              placeholder={t('shopOwner.shopManagement.phonePlaceholder')}
              value={form.phone}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{t('shopOwner.shopManagement.descriptionLabel')}</Text>
            <Input
              multiline
              numberOfLines={4}
              onChangeText={(value) => handleChange('description', value)}
              placeholder={t('shopOwner.shopManagement.descriptionPlaceholder')}
              value={form.description}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{t('shopOwner.shopManagement.bufferLabel')}</Text>
            <Input
              keyboardType="number-pad"
              onChangeText={(value) => handleChange('bufferMinutes', value)}
              placeholder={t('shopOwner.shopManagement.bufferPlaceholder')}
              value={form.bufferMinutes}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text fontWeight="700" textAlign={rtlLayout.textAlign}>{t('shopOwner.shopManagement.cancellationWindowLabel')}</Text>
            <Input
              keyboardType="number-pad"
              onChangeText={(value) => handleChange('cancellationWindowHours', value)}
              placeholder={t('shopOwner.shopManagement.cancellationWindowPlaceholder')}
              value={form.cancellationWindowHours}
            />
          </View>

          {errorMessage != null ? <Text color="$error" textAlign={rtlLayout.textAlign}>{errorMessage}</Text> : null}

          <Button onPress={() => void handleSave()} disabled={isSaving}>
            <ButtonText>
              {isSaving
                ? t('shopOwner.shopManagement.savingButton')
                : hasExistingShop
                  ? t('shopOwner.shopManagement.updateButton')
                  : t('shopOwner.shopManagement.createButton')}
            </ButtonText>
          </Button>
        </Card>

        <ShopClosuresCard shopId={shopQuery.data?.id ?? null} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    padding: 16,
  },
  contentContainer: {
    flexGrow: 1,
  },
  errorScreen: {
    flex: 1,
    padding: 16,
  },
  coverImage: {
    borderCurve: 'continuous',
    borderRadius: 16,
    height: 180,
    width: '100%',
  },
  coverPlaceholder: {
    alignItems: 'center',
    borderColor: '#cbd5e1',
    borderCurve: 'continuous',
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    height: 180,
    justifyContent: 'center',
  },
  fieldGroup: {
    gap: 8,
  },
});
