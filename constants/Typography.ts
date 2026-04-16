import { I18nManager } from 'react-native';

const isArabic = I18nManager.isRTL;

export const Typography = {
    phonk: {
        bold: isArabic ? 'JaliArabicBold' : 'Phonk',
    },
    poppins: {
        medium: isArabic ? 'JaliArabicRegular' : 'Poppins',
        semiBold: isArabic ? 'JaliArabicBold' : 'Poppins',
    }
};

export default Typography;
