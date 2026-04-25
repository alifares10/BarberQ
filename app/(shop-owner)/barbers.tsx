import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BarberAvailabilityModal, Button, ButtonText, Card, Input, LoadingScreen, StateCard, Text } from '@/components';
import {
  createBarber,
  createService,
  fetchBarberServiceLinksByShopId,
  fetchBarbersByShopId,
  fetchServicesByShopId,
  fetchShopByOwnerId,
  replaceBarberServiceLinks,
  updateBarber,
  updateService,
  uploadBarberAvatarImage,
} from '@/lib/shop-owner/api';
import { shopOwnerQueryKeys } from '@/lib/shop-owner/query-keys';
import { useAppTheme } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth-store';
import type { Database } from '@/types/database';

type Barber = Database['public']['Tables']['barbers']['Row'];
type Service = Database['public']['Tables']['services']['Row'];
type HubTab = 'barbers' | 'services';

type BarberFormState = {
  bio: string;
  name: string;
};

type ServiceFormState = {
  description: string;
  duration: string;
  name: string;
  price: string;
};

type PendingPickedImage = {
  base64: string;
  mimeType: string | null;
  uri: string;
};

const DEFAULT_BARBER_FORM: BarberFormState = {
  bio: '',
  name: '',
};

const DEFAULT_SERVICE_FORM: ServiceFormState = {
  description: '',
  duration: '30',
  name: '',
  price: '80',
};

type BarberItemProps = {
  assignedServices: number;
  avatarUrl: string | null;
  barberId: string;
  bio: string | null;
  isActive: boolean;
  onManageAvailability: (barberId: string) => void;
  name: string;
  onAssignServices: (barberId: string) => void;
  onEdit: (barberId: string) => void;
  onToggleActive: (barberId: string, nextValue: boolean) => void;
};

const BarberItem = memo(function BarberItem({
  assignedServices,
  avatarUrl,
  barberId,
  bio,
  isActive,
  onManageAvailability,
  name,
  onAssignServices,
  onEdit,
  onToggleActive,
}: BarberItemProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <Card>
      <View style={styles.rowGap12}>
        {avatarUrl != null ? (
          <Image contentFit="cover" source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceMuted, borderColor: colors.chipBorder }]}>
            <Text color="$colorMuted">{name.slice(0, 1).toUpperCase()}</Text>
          </View>
        )}

        <View style={styles.grow}>
          <Text fontWeight="700">{name}</Text>
          <Text color="$colorMuted">{bio == null || bio.length === 0 ? t('shopOwner.managementHub.noBio') : bio}</Text>
          <Text color="$colorMuted">
            {t('shopOwner.managementHub.assignedServicesCount', { count: assignedServices })}
          </Text>
        </View>
      </View>

      <View style={styles.rowWrap}>
        <Button onPress={() => onEdit(barberId)}>
          <ButtonText>{t('shopOwner.managementHub.actions.edit')}</ButtonText>
        </Button>
        <Button onPress={() => onAssignServices(barberId)}>
          <ButtonText>{t('shopOwner.managementHub.actions.assignServices')}</ButtonText>
        </Button>
        <Button onPress={() => onManageAvailability(barberId)}>
          <ButtonText>{t('shopOwner.managementHub.actions.manageAvailability')}</ButtonText>
        </Button>
        <Button onPress={() => onToggleActive(barberId, !isActive)}>
          <ButtonText>
            {isActive
              ? t('shopOwner.managementHub.actions.deactivate')
              : t('shopOwner.managementHub.actions.activate')}
          </ButtonText>
        </Button>
      </View>
    </Card>
  );
});

type ServiceItemProps = {
  duration: number;
  isActive: boolean;
  name: string;
  onEdit: (serviceId: string) => void;
  onToggleActive: (serviceId: string, nextValue: boolean) => void;
  price: number;
  serviceId: string;
};

const ServiceItem = memo(function ServiceItem({
  duration,
  isActive,
  name,
  onEdit,
  onToggleActive,
  price,
  serviceId,
}: ServiceItemProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <Text fontWeight="700">{name}</Text>
      <Text color="$colorMuted">
        {t('shopOwner.managementHub.serviceMeta', {
          duration,
          price: price.toFixed(2),
        })}
      </Text>

      <View style={styles.rowWrap}>
        <Button onPress={() => onEdit(serviceId)}>
          <ButtonText>{t('shopOwner.managementHub.actions.edit')}</ButtonText>
        </Button>
        <Button onPress={() => onToggleActive(serviceId, !isActive)}>
          <ButtonText>
            {isActive
              ? t('shopOwner.managementHub.actions.deactivate')
              : t('shopOwner.managementHub.actions.activate')}
          </ButtonText>
        </Button>
      </View>
    </Card>
  );
});

export default function BarbersScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const ownerId = session?.user.id ?? null;
  const [activeTab, setActiveTab] = useState<HubTab>('barbers');
  const [barberError, setBarberError] = useState<string | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [isBarberModalVisible, setBarberModalVisible] = useState(false);
  const [isServiceModalVisible, setServiceModalVisible] = useState(false);
  const [isAssignmentModalVisible, setAssignmentModalVisible] = useState(false);
  const [isAvailabilityModalVisible, setAvailabilityModalVisible] = useState(false);
  const [editingBarberId, setEditingBarberId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [assignmentBarberId, setAssignmentBarberId] = useState<string | null>(null);
  const [availabilityBarberId, setAvailabilityBarberId] = useState<string | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [pendingAvatarImage, setPendingAvatarImage] = useState<PendingPickedImage | null>(null);
  const [barberForm, setBarberForm] = useState<BarberFormState>(DEFAULT_BARBER_FORM);
  const [serviceForm, setServiceForm] = useState<ServiceFormState>(DEFAULT_SERVICE_FORM);
  const shopQuery = useQuery({
    enabled: ownerId != null,
    queryFn: () => fetchShopByOwnerId(ownerId ?? ''),
    queryKey: ownerId != null ? shopOwnerQueryKeys.shopByOwner(ownerId) : ['shop-owner', 'shop', 'unknown'],
  });
  const shopId = shopQuery.data?.id ?? null;
  const barbersQuery = useQuery({
    enabled: shopId != null,
    queryFn: () => fetchBarbersByShopId(shopId ?? ''),
    queryKey: shopId != null ? shopOwnerQueryKeys.barbersByShop(shopId) : ['shop-owner', 'barbers', 'unknown'],
  });
  const servicesQuery = useQuery({
    enabled: shopId != null,
    queryFn: () => fetchServicesByShopId(shopId ?? ''),
    queryKey: shopId != null ? shopOwnerQueryKeys.servicesByShop(shopId) : ['shop-owner', 'services', 'unknown'],
  });
  const linksQuery = useQuery({
    enabled: shopId != null,
    queryFn: () => fetchBarberServiceLinksByShopId(shopId ?? ''),
    queryKey:
      shopId != null ? shopOwnerQueryKeys.barberServiceLinksByShop(shopId) : ['shop-owner', 'barber-service-links', 'unknown'],
  });
  const saveBarberMutation = useMutation({
    mutationFn: async () => {
      if (ownerId == null || shopId == null) {
        throw new Error(t('shopOwner.managementHub.errors.missingShop'));
      }

      const name = barberForm.name.trim();
      const bio = barberForm.bio.trim();

      if (name.length === 0) {
        throw new Error(t('shopOwner.managementHub.errors.invalidBarberName'));
      }

      const savedBarber =
        editingBarberId == null
          ? await createBarber({
              bio: bio.length === 0 ? null : bio,
              name,
              shop_id: shopId,
            })
          : await updateBarber(editingBarberId, {
              bio: bio.length === 0 ? null : bio,
              name,
            });

      if (pendingAvatarImage == null) {
        return savedBarber;
      }

      const avatarUrl = await uploadBarberAvatarImage({
        base64Data: pendingAvatarImage.base64,
        barberId: savedBarber.id,
        fileUri: pendingAvatarImage.uri,
        mimeType: pendingAvatarImage.mimeType,
        ownerId,
        shopId,
      });

      return updateBarber(savedBarber.id, {
        avatar_url: avatarUrl,
      });
    },
    onSuccess: () => {
      if (shopId != null) {
        void queryClient.invalidateQueries({ queryKey: shopOwnerQueryKeys.barbersByShop(shopId) });
      }

      setBarberModalVisible(false);
      setEditingBarberId(null);
      setPendingAvatarImage(null);
      setBarberForm(DEFAULT_BARBER_FORM);
      setBarberError(null);
    },
  });
  const toggleBarberMutation = useMutation({
    mutationFn: ({ barberId, nextValue }: { barberId: string; nextValue: boolean }) =>
      updateBarber(barberId, { is_active: nextValue }),
    onSuccess: () => {
      if (shopId != null) {
        void queryClient.invalidateQueries({ queryKey: shopOwnerQueryKeys.barbersByShop(shopId) });
      }
    },
  });
  const saveServiceMutation = useMutation({
    mutationFn: async () => {
      if (shopId == null) {
        throw new Error(t('shopOwner.managementHub.errors.missingShop'));
      }

      const name = serviceForm.name.trim();
      const description = serviceForm.description.trim();
      const duration = Number.parseInt(serviceForm.duration, 10);
      const price = Number.parseFloat(serviceForm.price);

      if (name.length === 0) {
        throw new Error(t('shopOwner.managementHub.errors.invalidServiceName'));
      }

      if (!Number.isInteger(duration) || duration <= 0) {
        throw new Error(t('shopOwner.managementHub.errors.invalidDuration'));
      }

      if (!Number.isFinite(price) || price < 0) {
        throw new Error(t('shopOwner.managementHub.errors.invalidPrice'));
      }

      if (editingServiceId == null) {
        return createService({
          description: description.length === 0 ? null : description,
          duration,
          name,
          price,
          shop_id: shopId,
        });
      }

      return updateService(editingServiceId, {
        description: description.length === 0 ? null : description,
        duration,
        name,
        price,
      });
    },
    onSuccess: () => {
      if (shopId != null) {
        void queryClient.invalidateQueries({ queryKey: shopOwnerQueryKeys.servicesByShop(shopId) });
      }

      setServiceModalVisible(false);
      setEditingServiceId(null);
      setServiceForm(DEFAULT_SERVICE_FORM);
      setServiceError(null);
    },
  });
  const toggleServiceMutation = useMutation({
    mutationFn: ({ nextValue, serviceId }: { nextValue: boolean; serviceId: string }) =>
      updateService(serviceId, { is_active: nextValue }),
    onSuccess: () => {
      if (shopId != null) {
        void queryClient.invalidateQueries({ queryKey: shopOwnerQueryKeys.servicesByShop(shopId) });
      }
    },
  });
  const saveAssignmentsMutation = useMutation({
    mutationFn: async () => {
      if (assignmentBarberId == null || shopId == null) {
        throw new Error(t('shopOwner.managementHub.errors.assignmentBarberMissing'));
      }

      await replaceBarberServiceLinks({
        barberId: assignmentBarberId,
        serviceIds: selectedServiceIds,
      });
    },
    onSuccess: () => {
      if (shopId != null) {
        void queryClient.invalidateQueries({ queryKey: shopOwnerQueryKeys.barberServiceLinksByShop(shopId) });
      }

      setAssignmentModalVisible(false);
      setAssignmentBarberId(null);
      setSelectedServiceIds([]);
      setAssignmentError(null);
    },
  });

  const assignmentMap = useMemo(() => {
    const map = new Map<string, string[]>();

    for (const link of linksQuery.data ?? []) {
      const currentLinks = map.get(link.barber_id) ?? [];
      map.set(link.barber_id, [...currentLinks, link.service_id]);
    }

    return map;
  }, [linksQuery.data]);

  const openCreateBarberModal = useCallback(() => {
    setBarberError(null);
    setEditingBarberId(null);
    setPendingAvatarImage(null);
    setBarberForm(DEFAULT_BARBER_FORM);
    setBarberModalVisible(true);
  }, []);

  const openEditBarberModal = useCallback(
    (barberId: string) => {
      const barber = (barbersQuery.data ?? []).find((item) => item.id === barberId);

      if (barber == null) {
        return;
      }

      setBarberError(null);
      setEditingBarberId(barberId);
      setPendingAvatarImage(null);
      setBarberForm({
        bio: barber.bio ?? '',
        name: barber.name,
      });
      setBarberModalVisible(true);
    },
    [barbersQuery.data]
  );

  const openCreateServiceModal = useCallback(() => {
    setServiceError(null);
    setEditingServiceId(null);
    setServiceForm(DEFAULT_SERVICE_FORM);
    setServiceModalVisible(true);
  }, []);

  const openEditServiceModal = useCallback(
    (serviceId: string) => {
      const service = (servicesQuery.data ?? []).find((item) => item.id === serviceId);

      if (service == null) {
        return;
      }

      setServiceError(null);
      setEditingServiceId(serviceId);
      setServiceForm({
        description: service.description ?? '',
        duration: String(service.duration),
        name: service.name,
        price: String(service.price),
      });
      setServiceModalVisible(true);
    },
    [servicesQuery.data]
  );

  const openAssignServicesModal = useCallback(
    (barberId: string) => {
      const linkedServices = assignmentMap.get(barberId) ?? [];

      setAssignmentError(null);
      setAssignmentBarberId(barberId);
      setSelectedServiceIds(linkedServices);
      setAssignmentModalVisible(true);
    },
    [assignmentMap]
  );

  const openAvailabilityModal = useCallback((barberId: string) => {
    setAvailabilityBarberId(barberId);
    setAvailabilityModalVisible(true);
  }, []);

  const pickBarberAvatar = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setBarberError(t('shopOwner.managementHub.errors.mediaPermission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    const selectedAsset = result.assets[0];

    if (selectedAsset == null) {
      setBarberError(t('shopOwner.managementHub.errors.imageSelectionFailed'));
      return;
    }

    if (selectedAsset.base64 == null || selectedAsset.base64.length === 0) {
      setBarberError(t('shopOwner.managementHub.errors.imageSelectionFailed'));
      return;
    }

    setPendingAvatarImage({
      base64: selectedAsset.base64,
      mimeType: selectedAsset.mimeType ?? null,
      uri: selectedAsset.uri,
    });
  }, [t]);

  const toggleServiceSelection = useCallback((serviceId: string) => {
    setSelectedServiceIds((currentValue) =>
      currentValue.includes(serviceId)
        ? currentValue.filter((item) => item !== serviceId)
        : [...currentValue, serviceId]
    );
  }, []);

  const handleSaveBarber = useCallback(async () => {
    try {
      await saveBarberMutation.mutateAsync();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('shopOwner.managementHub.errors.generic');
      setBarberError(message);
    }
  }, [saveBarberMutation, t]);

  const handleSaveService = useCallback(async () => {
    try {
      await saveServiceMutation.mutateAsync();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('shopOwner.managementHub.errors.generic');
      setServiceError(message);
    }
  }, [saveServiceMutation, t]);

  const handleSaveAssignments = useCallback(async () => {
    try {
      await saveAssignmentsMutation.mutateAsync();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('shopOwner.managementHub.errors.generic');
      setAssignmentError(message);
    }
  }, [saveAssignmentsMutation, t]);

  const handleToggleBarber = useCallback((barberId: string, nextValue: boolean) => {
    void toggleBarberMutation.mutateAsync({ barberId, nextValue });
  }, [toggleBarberMutation]);

  const handleToggleService = useCallback((serviceId: string, nextValue: boolean) => {
    void toggleServiceMutation.mutateAsync({ nextValue, serviceId });
  }, [toggleServiceMutation]);

  const assignmentBarberName = useMemo(() => {
    if (assignmentBarberId == null) {
      return null;
    }

    return (barbersQuery.data ?? []).find((barber) => barber.id === assignmentBarberId)?.name ?? null;
  }, [assignmentBarberId, barbersQuery.data]);
  const availabilityBarber = useMemo(() => {
    if (availabilityBarberId == null) {
      return null;
    }

    return (barbersQuery.data ?? []).find((barber) => barber.id === availabilityBarberId) ?? null;
  }, [availabilityBarberId, barbersQuery.data]);

  const renderBarberItem = useCallback<ListRenderItem<Barber>>(
    ({ item }) => (
      <BarberItem
        assignedServices={(assignmentMap.get(item.id) ?? []).length}
        avatarUrl={item.avatar_url}
        barberId={item.id}
        bio={item.bio}
        isActive={item.is_active}
        name={item.name}
        onAssignServices={openAssignServicesModal}
        onEdit={openEditBarberModal}
        onManageAvailability={openAvailabilityModal}
        onToggleActive={handleToggleBarber}
      />
    ),
    [assignmentMap, handleToggleBarber, openAssignServicesModal, openAvailabilityModal, openEditBarberModal]
  );

  const renderServiceItem = useCallback<ListRenderItem<Service>>(
    ({ item }) => (
      <ServiceItem
        duration={item.duration}
        isActive={item.is_active}
        name={item.name}
        onEdit={openEditServiceModal}
        onToggleActive={handleToggleService}
        price={item.price}
        serviceId={item.id}
      />
    ),
    [handleToggleService, openEditServiceModal]
  );

  const hasHubQueryError =
    shopQuery.isError ||
    (shopId != null && (barbersQuery.isError || servicesQuery.isError || linksQuery.isError));

  const handleRetryLoad = useCallback(async () => {
    await shopQuery.refetch();

    if (shopId == null) {
      return;
    }

    await Promise.all([barbersQuery.refetch(), servicesQuery.refetch(), linksQuery.refetch()]);
  }, [barbersQuery, linksQuery, servicesQuery, shopId, shopQuery]);

  if (shopQuery.isPending || barbersQuery.isPending || servicesQuery.isPending || linksQuery.isPending) {
    return <LoadingScreen />;
  }

  if (shopQuery.data == null) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <StateCard
          actionLabel={t('shopOwner.managementHub.goToShopButton')}
          description={t('shopOwner.managementHub.missingShopDescription')}
          onAction={() => router.push('/(shop-owner)/shop')}
          title={t('shopOwner.managementHub.missingShopTitle')}
          variant="info"
        />
      </View>
    );
  }

  if (hasHubQueryError) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <StateCard
          actionLabel={t('shopOwner.managementHub.retryButton')}
          description={t('shopOwner.managementHub.loadError')}
          onAction={() => void handleRetryLoad()}
          variant="error"
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Card>
        <Text fontFamily="$heading" fontSize={28} fontWeight="800" lineHeight={34}>
          {t('shopOwner.managementHub.title')}
        </Text>
        <Text color="$colorMuted">{t('shopOwner.managementHub.description')}</Text>

        <View style={styles.segmentRow}>
          <Button onPress={() => setActiveTab('barbers')}>
            <ButtonText>{t('tabs.barbers')}</ButtonText>
          </Button>
          <Button onPress={() => setActiveTab('services')}>
            <ButtonText>{t('shopOwner.managementHub.servicesTab')}</ButtonText>
          </Button>
        </View>

        {activeTab === 'barbers' ? (
          <Button onPress={openCreateBarberModal}>
            <ButtonText>{t('shopOwner.managementHub.addBarberButton')}</ButtonText>
          </Button>
        ) : (
          <Button onPress={openCreateServiceModal}>
            <ButtonText>{t('shopOwner.managementHub.addServiceButton')}</ButtonText>
          </Button>
        )}
      </Card>

      {activeTab === 'barbers' ? (
        <FlashList
          ListEmptyComponent={
            <StateCard description={t('shopOwner.managementHub.emptyBarbers')} variant="empty" />
          }
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.listContainer}
          data={barbersQuery.data ?? []}

          keyExtractor={(item) => item.id}
          renderItem={renderBarberItem}
        />
      ) : (
        <FlashList
          ListEmptyComponent={
            <StateCard description={t('shopOwner.managementHub.emptyServices')} variant="empty" />
          }
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.listContainer}
          data={servicesQuery.data ?? []}

          keyExtractor={(item) => item.id}
          renderItem={renderServiceItem}
        />
      )}

      <Modal
        animationType="slide"
        presentationStyle="formSheet"
        visible={isBarberModalVisible}
        onRequestClose={() => setBarberModalVisible(false)}
      >
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <Text fontFamily="$heading" fontSize={24} fontWeight="800" lineHeight={30}>
            {editingBarberId == null
              ? t('shopOwner.managementHub.createBarberTitle')
              : t('shopOwner.managementHub.editBarberTitle')}
          </Text>

          <View style={styles.fieldGroup}>
            <Text fontWeight="700">{t('shopOwner.managementHub.barberAvatarLabel')}</Text>
            {pendingAvatarImage != null ? (
              <Image source={{ uri: pendingAvatarImage.uri }} style={styles.avatarPreview} contentFit="cover" />
            ) : null}
            <Button onPress={() => void pickBarberAvatar()}>
              <ButtonText>{t('shopOwner.managementHub.chooseAvatarButton')}</ButtonText>
            </Button>
          </View>

          <View style={styles.fieldGroup}>
            <Text fontWeight="700">{t('shopOwner.managementHub.barberNameLabel')}</Text>
            <Input
              autoCapitalize="words"
              onChangeText={(value) => setBarberForm((currentValue) => ({ ...currentValue, name: value }))}
              placeholder={t('shopOwner.managementHub.barberNamePlaceholder')}
              value={barberForm.name}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text fontWeight="700">{t('shopOwner.managementHub.barberBioLabel')}</Text>
            <Input
              multiline
              onChangeText={(value) => setBarberForm((currentValue) => ({ ...currentValue, bio: value }))}
              placeholder={t('shopOwner.managementHub.barberBioPlaceholder')}
              value={barberForm.bio}
            />
          </View>

          {barberError != null ? <Text color="$error">{barberError}</Text> : null}

          <View style={styles.rowWrap}>
            <Button onPress={() => setBarberModalVisible(false)}>
              <ButtonText>{t('shopOwner.managementHub.actions.cancel')}</ButtonText>
            </Button>
            <Button onPress={() => void handleSaveBarber()}>
              <ButtonText>
                {saveBarberMutation.isPending
                  ? t('shopOwner.managementHub.savingButton')
                  : t('shopOwner.managementHub.actions.save')}
              </ButtonText>
            </Button>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        presentationStyle="formSheet"
        visible={isServiceModalVisible}
        onRequestClose={() => setServiceModalVisible(false)}
      >
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <Text fontFamily="$heading" fontSize={24} fontWeight="800" lineHeight={30}>
            {editingServiceId == null
              ? t('shopOwner.managementHub.createServiceTitle')
              : t('shopOwner.managementHub.editServiceTitle')}
          </Text>

          <View style={styles.fieldGroup}>
            <Text fontWeight="700">{t('shopOwner.managementHub.serviceNameLabel')}</Text>
            <Input
              autoCapitalize="words"
              onChangeText={(value) => setServiceForm((currentValue) => ({ ...currentValue, name: value }))}
              placeholder={t('shopOwner.managementHub.serviceNamePlaceholder')}
              value={serviceForm.name}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text fontWeight="700">{t('shopOwner.managementHub.serviceDurationLabel')}</Text>
            <Input
              keyboardType="number-pad"
              onChangeText={(value) => setServiceForm((currentValue) => ({ ...currentValue, duration: value }))}
              placeholder={t('shopOwner.managementHub.serviceDurationPlaceholder')}
              value={serviceForm.duration}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text fontWeight="700">{t('shopOwner.managementHub.servicePriceLabel')}</Text>
            <Input
              keyboardType="decimal-pad"
              onChangeText={(value) => setServiceForm((currentValue) => ({ ...currentValue, price: value }))}
              placeholder={t('shopOwner.managementHub.servicePricePlaceholder')}
              value={serviceForm.price}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text fontWeight="700">{t('shopOwner.managementHub.serviceDescriptionLabel')}</Text>
            <Input
              multiline
              onChangeText={(value) =>
                setServiceForm((currentValue) => ({
                  ...currentValue,
                  description: value,
                }))
              }
              placeholder={t('shopOwner.managementHub.serviceDescriptionPlaceholder')}
              value={serviceForm.description}
            />
          </View>

          {serviceError != null ? <Text color="$error">{serviceError}</Text> : null}

          <View style={styles.rowWrap}>
            <Button onPress={() => setServiceModalVisible(false)}>
              <ButtonText>{t('shopOwner.managementHub.actions.cancel')}</ButtonText>
            </Button>
            <Button onPress={() => void handleSaveService()}>
              <ButtonText>
                {saveServiceMutation.isPending
                  ? t('shopOwner.managementHub.savingButton')
                  : t('shopOwner.managementHub.actions.save')}
              </ButtonText>
            </Button>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        presentationStyle="formSheet"
        visible={isAssignmentModalVisible}
        onRequestClose={() => setAssignmentModalVisible(false)}
      >
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <Text fontFamily="$heading" fontSize={24} fontWeight="800" lineHeight={30}>
            {t('shopOwner.managementHub.assignServicesTitle')}
          </Text>
          {assignmentBarberName != null ? (
            <Text color="$colorMuted">
              {t('shopOwner.managementHub.assignServicesSubtitle', { name: assignmentBarberName })}
            </Text>
          ) : null}

          <FlashList
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={styles.assignmentListContent}
            data={(servicesQuery.data ?? []).filter((service) => service.is_active)}

            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isSelected = selectedServiceIds.includes(item.id);

              return (
                <Pressable
                  onPress={() => toggleServiceSelection(item.id)}
                  style={[
                    styles.assignmentItem,
                    {
                      backgroundColor: isSelected ? colors.accentMuted : colors.card,
                      borderColor: isSelected ? colors.accent : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                >
                  <Text fontWeight="700">{item.name}</Text>
                  <Text color="$colorMuted">
                    {t('shopOwner.managementHub.serviceMeta', {
                      duration: item.duration,
                      price: item.price.toFixed(2),
                    })}
                  </Text>
                </Pressable>
              );
            }}
          />

          {assignmentError != null ? <Text color="$error">{assignmentError}</Text> : null}

          <View style={styles.rowWrap}>
            <Button onPress={() => setAssignmentModalVisible(false)}>
              <ButtonText>{t('shopOwner.managementHub.actions.cancel')}</ButtonText>
            </Button>
            <Button onPress={() => void handleSaveAssignments()}>
              <ButtonText>
                {saveAssignmentsMutation.isPending
                  ? t('shopOwner.managementHub.savingButton')
                  : t('shopOwner.managementHub.actions.saveAssignments')}
              </ButtonText>
            </Button>
          </View>
        </View>
      </Modal>

      <BarberAvailabilityModal
        barber={availabilityBarber}
        onClose={() => {
          setAvailabilityModalVisible(false);
          setAvailabilityBarberId(null);
        }}
        shopId={shopId}
        visible={isAvailabilityModalVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  assignmentItem: {
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  assignmentListContent: {
    gap: 8,
    paddingBottom: 12,
  },
  avatarImage: {
    borderCurve: 'continuous',
    borderRadius: 28,
    height: 56,
    width: 56,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  avatarPreview: {
    borderCurve: 'continuous',
    borderRadius: 16,
    height: 120,
    width: 120,
  },
  fieldGroup: {
    gap: 8,
  },
  grow: {
    flex: 1,
    gap: 4,
  },
  listContainer: {
    gap: 12,
    paddingBottom: 20,
  },
  modalRoot: {
    flex: 1,
    gap: 16,
    padding: 16,
  },
  rowGap12: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  screen: {
    flex: 1,
    gap: 12,
    padding: 16,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
