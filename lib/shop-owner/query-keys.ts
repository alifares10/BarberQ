export const shopOwnerQueryKeys = {
  appointmentsByShopAndDay: (shopId: string, date: string) => ['shop-owner', 'appointments', shopId, 'day', date] as const,
  appointmentsByShopAndRange: (shopId: string, startDate: string, endDate: string) =>
    ['shop-owner', 'appointments', shopId, 'range', startDate, endDate] as const,
  barberServiceLinksByShop: (shopId: string) => ['shop-owner', 'barber-service-links', shopId] as const,
  barberUnavailableDatesByShop: (shopId: string) => ['shop-owner', 'barber-unavailable-dates', shopId] as const,
  barbersByShop: (shopId: string) => ['shop-owner', 'barbers', shopId] as const,
  servicesByShop: (shopId: string) => ['shop-owner', 'services', shopId] as const,
  shopClosuresByShop: (shopId: string) => ['shop-owner', 'shop-closures', shopId] as const,
  shopByOwner: (ownerId: string) => ['shop-owner', 'shop', ownerId] as const,
  workingHoursByShop: (shopId: string) => ['shop-owner', 'working-hours', shopId] as const,
};
