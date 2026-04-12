import { I18nManager } from 'react-native';

const isArabic = I18nManager.isRTL;

export const Typography = {
    phonk: {
        bold: isArabic ? 'Noto' : 'Phonk',
    },
    poppins: {
        medium: isArabic ? 'Tajawal' : 'Poppins',
        semiBold: isArabic ? 'Tajawal' : 'Poppins',
    }
};

export default Typography;
