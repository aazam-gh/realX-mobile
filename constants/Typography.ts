import type { TextStyle } from 'react-native';

export const FontFamilyTokens = {
    display: 'Hanson',
    body: 'Poppins',
    bodyStrong: 'Poppins',
    displayArabicBlack: 'TajawalBlack',
} as const;

export const ArabicFontFamilyTokens = {
    display: 'JaliArabicBold',
    body: 'JaliArabicRegular',
    bodyStrong: 'JaliArabicBold',
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

export function getLocalizedTextVariantStyle(variant: TextVariant, locale: 'en' | 'ar'): TextStyle {
    return {
        fontFamily: locale === 'ar' ? ArabicFontFamilyTokens[variant] : FontFamilyTokens[variant],
        fontStyle: 'normal',
    };
}

export function getTextDirectionStyle({
    isRTL: explicitRTL,
    textAlign,
}: TextDirectionOptions = {}): TextStyle {
    const rtl = explicitRTL ?? false;

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
    getLocalizedTextVariantStyle,
    getTextDirectionStyle,
} as const;

export default Typography;
