import { create } from "zustand";

const useAgentStore = create((set) => ({
        agent : {  },
        setAgentData: (newAgent) => set({ agent:newAgent }),
        setAgentLogOut: () => set({ agent: {} })
    })
)


export default useAgentStore;