import { Image } from 'expo-image';
import { memo, useMemo } from 'react';
import { ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../context/AppThemeContext';
import { useAppLocale } from '../../context/LocaleContext';
import { Typography } from '../../constants/Typography';
import { HeaderIconButton } from '../navigation/AppHeader';

type Props = {
    title: string;
    icon?: string | ImageSourcePropType;
    onBackPress?: () => void;
};

function CategoryHeader({ title, icon, onBackPress }: Props) {
    const { theme } = useAppTheme();
    const { isRTL } = useAppLocale();
    const { t } = useTranslation();
    const imageSource = useMemo(() => {
        if (typeof icon === 'string') {
            return { uri: icon };
        }
        return icon;
    }, [icon]);

    return (
        <View style={styles.container}>
            <HeaderIconButton
                icon={isRTL ? 'arrow-forward' : 'arrow-back'}
                onPress={() => onBackPress?.()}
                accessibilityLabel={t('back')}
            />


            <View style={styles.titleContainer}>
                {icon && (
                    <Image
                        source={imageSource}
                        style={styles.imageIcon}

                        contentFit="cover"
                    />
                )}
                <Text style={[styles.title, { color: theme.text }, isRTL && styles.titleRTL]}>{title}</Text>
            </View>
        </View>
    );
}

export default memo(CategoryHeader);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 56,
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 21,
        lineHeight: 28,
        ...Typography.getTextVariantStyle('bodyStrong'),
    },
    titleRTL: {
        textAlign: 'right',
        writingDirection: 'rtl',
    },
    imageIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
});
