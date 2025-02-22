import { create } from "zustand";

const useAdminStore = create((set) => ({
    adminUsername:null,
    setAdminUserName: (username) => set({ adminUsername:username })
}))

export default useAdminStore;