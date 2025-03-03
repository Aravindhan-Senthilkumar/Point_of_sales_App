import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persist,createJSONStorage } from "zustand/middleware";

 const useAuthStore = create(
    persist((set) => ({
        authUser: null,
        setAuthUser : (string) => set({ authUser: string })
    }),
    {
        name:'auth-storage',
        storage:createJSONStorage(() => AsyncStorage)
    }
)
)


export default useAuthStore;