import create from 'zustand';

interface UIState {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const useUIStore = create<UIState>((set) => ({
  darkMode: true,
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
}));

export default useUIStore;