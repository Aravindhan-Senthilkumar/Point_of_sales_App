import { create } from "zustand";

const useProductStore = create((set) => ({
    isProductUpdated:false,
    setIsProductUpdated: (boolean) => set({ isProductUpdated:boolean })
}))

export default useProductStore;