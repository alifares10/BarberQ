import { create } from 'zustand';

type BookingStore = {
  notes: string;
  selectedBarberId: string | null;
  selectedDate: string | null;
  selectedServiceIds: string[];
  selectedShopId: string | null;
  selectedTime: string | null;
  reset: () => void;
  setNotes: (notes: string) => void;
  setSelectedBarberId: (barberId: string | null) => void;
  setSelectedDate: (date: string | null) => void;
  setSelectedServiceIds: (serviceIds: string[]) => void;
  setSelectedShopId: (shopId: string | null) => void;
  setSelectedTime: (time: string | null) => void;
};

const initialState = {
  notes: '',
  selectedBarberId: null,
  selectedDate: null,
  selectedServiceIds: [],
  selectedShopId: null,
  selectedTime: null,
};

export const useBookingStore = create<BookingStore>((set) => ({
  ...initialState,
  reset: () => {
    set(initialState);
  },
  setNotes: (notes) => {
    set({ notes });
  },
  setSelectedBarberId: (selectedBarberId) => {
    set({ selectedBarberId });
  },
  setSelectedDate: (selectedDate) => {
    set({ selectedDate });
  },
  setSelectedServiceIds: (selectedServiceIds) => {
    set({ selectedServiceIds });
  },
  setSelectedShopId: (selectedShopId) => {
    set({ selectedShopId });
  },
  setSelectedTime: (selectedTime) => {
    set({ selectedTime });
  },
}));
