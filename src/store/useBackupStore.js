import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persist,createJSONStorage } from "zustand/middleware";

const useBackUpStore = create(
    persist(
        (set) => ({
            lastBackedUpTime:null,
            setLastBackedUpTime: (time) => set({ lastBackedUpTime: time })
    }),
    {
        name:'backup-storage',
        storage:createJSONStorage(() => AsyncStorage),
    }
))

export default useBackUpStore;