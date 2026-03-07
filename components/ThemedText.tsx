import { Text, type TextProps } from 'react-native';
import { Typography } from '../constants/Typography';
import { useTheme } from '../context/ThemeContext';

export type ThemedTextProps = TextProps & {
    type?: 'default' | 'subtitle' | 'primary';
};

export function ThemedText({ style, type = 'default', ...rest }: ThemedTextProps) {
    const { theme } = useTheme();

    const textColor = type === 'subtitle' ? theme.subtitle :
        type === 'primary' ? theme.primary :
            theme.text;

    return <Text style={[{ color: textColor, fontFamily: Typography.metropolis.medium }, style]} {...rest} />;
}
