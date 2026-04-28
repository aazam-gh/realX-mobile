import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import PhonkText from '../PhonkText';

export default function XCardHeader() {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';

    return (
        <View style={[styles.container, isArabic && { flexDirection: 'row-reverse' }]}>
            <PhonkText style={styles.titleX}>{t('xcard_title_x')}</PhonkText>
            <PhonkText style={styles.titleCard}>{t('xcard_title_card')}</PhonkText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        gap: 4,
    },
    titleX: {
        fontSize: 28,
        color: '#18B852',
    },
    titleCard: {
        fontSize: 28,
        color: '#000000',
    },
});
