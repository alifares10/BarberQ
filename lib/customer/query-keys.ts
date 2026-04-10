export const customerQueryKeys = {
  activeShops: () => ['customer', 'shops'] as const,
  barberBookings: (barberId: string, date: string) => ['customer', 'barber-bookings', barberId, date] as const,
  barberUnavailable: (barberId: string, date: string) => ['customer', 'barber-unavailable', barberId, date] as const,
  barbersByShop: (shopId: string) => ['customer', 'barbers', shopId] as const,
  customerAppointments: (customerId: string) => ['customer', 'appointments', customerId] as const,
  servicesByBarber: (barberId: string) => ['customer', 'services', barberId] as const,
  shopById: (shopId: string) => ['customer', 'shop', shopId] as const,
  shopClosure: (shopId: string, date: string) => ['customer', 'shop-closure', shopId, date] as const,
  workingHours: (barberId: string, dayOfWeek: number) => ['customer', 'working-hours', barberId, dayOfWeek] as const,
};
