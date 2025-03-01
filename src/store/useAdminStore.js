import { create } from "zustand";


const useAdminStore = create((set) => ({
    adminUsername:null,
    adminId:null,
    setAdminUserName: (username) => set({ adminUsername:username }),
    setAdminId: (id) => set({ adminId:id })
    })
)

export default useAdminStore;