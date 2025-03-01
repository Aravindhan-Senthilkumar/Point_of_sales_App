import { create } from "zustand";


 const useAuthStore = create((set) => ({
        authUser: null,
        setAuthUser : (string) => set({ authUser: string })
    })
)


export default useAuthStore;