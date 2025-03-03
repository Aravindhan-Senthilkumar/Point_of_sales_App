import { create } from "zustand";
import { persist,createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

const useAgentStore = create(
    persist((set) => ({
        agent : {  },
        setAgentData: (newAgent) => set({ agent:newAgent }),
        setAgentLogOut: () => set({ agent: {} })
    }),
    {
        name:'agent-storage',
        storage:createJSONStorage(() => AsyncStorage)
    }
)
)

export default useAgentStore;