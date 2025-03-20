import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist,createJSONStorage } from "zustand/middleware";

const useAssigningStore = create(
  persist((set) => ({
  stockEntry: [],
  totalStockPrice:0,
  totalStockNos:0,
  setStockEntry: (updateFn) =>
    set((state) => ({
      stockEntry: updateFn(state.stockEntry),
    })),
  setTotalStockPrice: (value) => set((state) => ({
    totalStockPrice:  state.totalStockPrice + value
  })),
  setTotalStockNos: (value) => set((state) => ({
    totalStockNos: state.totalStockNos + value 
  })),
 resetStocks: () => set({ stockEntry: [] }),
 resetTotals: () => set({ totalStockPrice:0,totalStockNos:0 })
})
,
{
  name:'assign-storage',
  storage: createJSONStorage(() => AsyncStorage)
}
))

export default useAssigningStore;
