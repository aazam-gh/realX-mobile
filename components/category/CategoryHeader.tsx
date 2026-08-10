import { Image } from 'expo-image';
import { memo, ReactNode, useMemo } from 'react';
import { ImageSourcePropType, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppLocale } from '../../context/LocaleContext';
import { HeaderIconButton } from '../navigation/AppHeader';

type Props = {
    icon?: string | ImageSourcePropType;
    onBackPress?: () => void;
    accessory?: ReactNode;
};

function CategoryHeader({ icon, onBackPress, accessory }: Props) {
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


            <View style={styles.contentContainer}>
                {icon && (
                    <Image
                        source={imageSource}
                        style={styles.imageIcon}

                        contentFit="cover"
                    />
                )}
                {accessory}
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
    contentContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    imageIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
});
