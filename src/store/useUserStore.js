import { create } from "zustand";

const useUserStore = create((set) => ({
    agent : {  },
    setAgentData: (newAgent) => set({ agent:newAgent }),
})) 

export default useUserStore;