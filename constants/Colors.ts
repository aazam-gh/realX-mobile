/**
 * Unified color palette for the application.
 */

const primaryRed = '#E60000';
const darkBackground = '#25292e';
const gold = '#ffd33d';

export const Colors = {
    light: {
        text: '#000000',
        background: '#FFFFFF',
        tint: primaryRed,
        subtitle: '#666666',
        tabIconDefault: '#666666',
        tabIconSelected: primaryRed,
        primary: primaryRed,
        buttonText: '#FFFFFF',
    },
    dark: {
        text: '#FFFFFF',
        background: darkBackground,
        tint: gold,
        subtitle: '#9BA1A6',
        tabIconDefault: '#9BA1A6',
        tabIconSelected: gold,
        primary: primaryRed,
        buttonText: '#FFFFFF',
    },
    // Specific onboarding colors if they need to be fixed regardless of theme
    onboarding: {
        background: '#FFFFFF',
        title: '#000000',
        subtitle: '#666666',
        primary: primaryRed,
        buttonText: '#FFFFFF',
        shadow: primaryRed,
    }
};

export default Colors;
