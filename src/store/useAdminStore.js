import { create } from "zustand";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist,createJSONStorage } from "zustand/middleware";

const useAdminStore = create(
    persist(
        (set) => ({
    adminUsername:null,
    adminId:null,
    setAdminUserName: (username) => set({ adminUsername:username }),
    setAdminId: (id) => set({ adminId:id })
    }),
    {
        name:'admin-storage',
        storage:createJSONStorage(() => AsyncStorage),
    }
))

export default useAdminStore;