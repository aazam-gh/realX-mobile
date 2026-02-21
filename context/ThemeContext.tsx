import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName, useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';

const ThemeContext = createContext({
    theme: Colors.light,
    colorScheme: 'light' as ColorSchemeName,
    toggleTheme: () => { },
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemColorScheme = useColorScheme();
    const [colorScheme, setColorScheme] = useState<ColorSchemeName>(systemColorScheme || 'light');

    useEffect(() => {
        setColorScheme(systemColorScheme || 'light');
    }, [systemColorScheme]);

    const toggleTheme = () => {
        const newColorScheme = colorScheme === 'light' ? 'dark' : 'light';
        setColorScheme(newColorScheme);
        Appearance.setColorScheme(newColorScheme);
    };

    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    return (
        <ThemeContext.Provider value={{ theme, colorScheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
