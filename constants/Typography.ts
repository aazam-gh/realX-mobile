import { I18nManager, type TextStyle } from 'react-native';

const isArabic = I18nManager.isRTL;

export const FontFamilyTokens = {
    display: isArabic ? 'JaliArabicBold' : 'Hanson',
    body: isArabic ? 'JaliArabicRegular' : 'Poppins',
    bodyStrong: isArabic ? 'JaliArabicBold' : 'Poppins',
    displayArabicBlack: 'TajawalBlack',
} as const;

export type TextVariant =
    | 'display'
    | 'body'
    | 'bodyStrong'
    | 'displayArabicBlack';

const textVariantStyles: Record<TextVariant, TextStyle> = {
    display: {
        fontFamily: FontFamilyTokens.display,
        fontStyle: 'normal',
    },
    body: {
        fontFamily: FontFamilyTokens.body,
        fontStyle: 'normal',
    },
    bodyStrong: {
        fontFamily: FontFamilyTokens.bodyStrong,
        fontStyle: 'normal',
    },
    displayArabicBlack: {
        fontFamily: FontFamilyTokens.displayArabicBlack,
        fontStyle: 'normal',
    },
};

type TextDirectionOptions = {
    isRTL?: boolean;
    textAlign?: TextStyle['textAlign'];
};

export function getTextVariantStyle(variant: TextVariant): TextStyle {
    return textVariantStyles[variant];
}

export function getTextDirectionStyle({
    isRTL: explicitRTL,
    textAlign,
}: TextDirectionOptions = {}): TextStyle {
    const rtl = explicitRTL ?? isArabic;

    return {
        writingDirection: rtl ? 'rtl' : 'ltr',
        ...(textAlign ? { textAlign } : null),
    };
}

export const Typography = {
    hanson: {
        bold: FontFamilyTokens.display,
    },
    poppins: {
        medium: FontFamilyTokens.body,
        semiBold: FontFamilyTokens.bodyStrong,
    },
    tajawal: {
        black: FontFamilyTokens.displayArabicBlack,
    },
    fontFamily: FontFamilyTokens,
    variants: textVariantStyles,
    getTextVariantStyle,
    getTextDirectionStyle,
} as const;

export default Typography;
