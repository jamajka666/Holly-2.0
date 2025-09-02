import { useEffect } from 'react';
import { useStore } from '../store/uiStore';

const useSidebar = () => {
    const { darkMode, toggleDarkMode } = useStore();

    useEffect(() => {
        // Apply dark mode class to body
        document.body.classList.toggle('dark-mode', darkMode);
    }, [darkMode]);

    return { darkMode, toggleDarkMode };
};

export default useSidebar;