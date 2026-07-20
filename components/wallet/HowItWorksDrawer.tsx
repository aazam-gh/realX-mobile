import { useMemo } from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Typography } from '../../constants/Typography';
import AppText from '../AppText';
import AndroidBottomSheetModal from '../AndroidBottomSheetModal';
import { useAppTheme } from '../../context/AppThemeContext';
import { useAppLocale } from '../../context/LocaleContext';
import { toArabicDigits } from '../../utils/numbers';
import { BottomSheetOverscanBackground, getBottomSheetBackgroundModifiers } from '../../utils/expoUiBottomSheet';

type Props = {
    visible: boolean;
    onClose: () => void;
};

type StepData = {
    number: string;
    text: string;
};

type StepItemProps = {
    step: StepData;
    isArabic: boolean;
};

function StepItem({ step, isArabic }: StepItemProps) {
    const { theme } = useAppTheme();

    return (
        <View
            style={[
                styles.stepItem,
                { backgroundColor: theme.cardMuted },
                isArabic ? styles.stepItemRTL : styles.stepItemLTR,
            ]}
        >
            <View style={styles.stepNumberColumn}>
                <AppText
                    style={[
                        styles.stepNumber,
                        isArabic && styles.stepNumberRTL,
                        { color: theme.brand },
                    ]}
                >
                    {isArabic ? toArabicDigits(step.number) : step.number}
                </AppText>
            </View>
            <Text
                style={[
                    styles.stepText,
                    isArabic && styles.stepTextRTL,
                    {
                        color: theme.text,
                        textAlign: isArabic ? 'right' : 'left',
                        writingDirection: isArabic ? 'rtl' : 'ltr',
                    },
                ]}
            >
                {step.text}
            </Text>
        </View>
    );
}

export default function HowItWorksDrawer({ visible, onClose }: Props) {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const { t } = useTranslation();
    const { theme } = useAppTheme();
    const { locale } = useAppLocale();
    const isArabic = locale === 'ar';
    const sheetBackgroundModifiers = useMemo(
        () => getBottomSheetBackgroundModifiers(theme.surfaceElevated),
        [theme.surfaceElevated],
    );

    const steps: StepData[] = [
        { number: '1', text: t('how_it_works_step_1') },
        { number: '2', text: t('how_it_works_step_2') },
        { number: '3', text: t('how_it_works_step_3') },
        { number: '4', text: t('how_it_works_step_4') },
        { number: '5', text: t('how_it_works_step_5') },
    ];

    const sheetBody = (
        <View style={styles.content}>
            <View style={styles.logoContainer}>
                {isArabic ? (
                    <Text style={styles.logoArabicText}>
                        <Text style={[styles.logoCardArabic, { color: theme.text }]}>{t('xcard_title_card')}</Text>
                        {' '}
                        <Text style={[styles.logoXArabic, { color: theme.brand }]}>{t('xcard_title_x')}</Text>
                    </Text>
                ) : (
                    <>
                        <AppText style={[styles.logoX, { color: theme.brand }]}>{t('xcard_title_x')}</AppText>
                        <AppText style={[styles.logoCard, { color: theme.text }]}>{t('xcard_title_card')}</AppText>
                    </>
                )}
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View
                style={[
                    styles.titleContainer,
                    isArabic && styles.titleContainerRTL,
                ]}
            >
                <AppText
                    style={[
                        styles.titleText,
                        Typography.getTextDirectionStyle({ isRTL: isArabic }),
                        { color: theme.text },
                    ]}
                >
                    {t('how_it_works_title_prefix')}
                    <Text style={[styles.titleHighlight, { color: theme.brand }]}>
                        {t('how_it_works_title_highlight')}
                    </Text>
                    {t('how_it_works_title_suffix')}
                </AppText>
            </View>

            <View style={styles.stepsContainer}>
                {steps.map((step) => (
                    <StepItem key={step.number} step={step} isArabic={isArabic} />
                ))}
            </View>
        </View>
    );

    if (Platform.OS === 'android') {
        return (
            <AndroidBottomSheetModal
                visible={visible}
                onClose={onClose}
                backgroundColor={theme.surfaceElevated}
                testID="xcard-how-it-works-bottom-sheet"
            >
                {sheetBody}
            </AndroidBottomSheetModal>
        );
    }

    const {
        BottomSheet: SwiftUIBottomSheet,
        Group: SwiftUIGroup,
        Host: SwiftUIHost,
        RNHostView: SwiftUIRNHostView,
        // eslint-disable-next-line @typescript-eslint/no-require-imports
    } = require('@expo/ui/swift-ui');
    const {
        frame,
        presentationDragIndicator,
        // eslint-disable-next-line @typescript-eslint/no-require-imports
    } = require('@expo/ui/swift-ui/modifiers');

    return (
        <SwiftUIHost style={StyleSheet.absoluteFill} pointerEvents="none">
            <SwiftUIBottomSheet
                isPresented={visible}
                onIsPresentedChange={(presented: boolean) => {
                    if (!presented) onClose();
                }}
                fitToContents
                testID="xcard-how-it-works-bottom-sheet"
            >
                <SwiftUIGroup
                    modifiers={[
                        frame({ maxWidth: Infinity, alignment: 'topLeading' }),
                        presentationDragIndicator('visible'),
                        ...(sheetBackgroundModifiers ?? []),
                    ]}
                >
                    <SwiftUIRNHostView matchContents>
                        <View
                            style={[
                                styles.sheetContent,
                                {
                                    backgroundColor: theme.surfaceElevated,
                                    width,
                                    paddingBottom: Math.max(insets.bottom, 16),
                                },
                            ]}
                        >
                            <BottomSheetOverscanBackground backgroundColor={theme.surfaceElevated} />
                            {sheetBody}
                        </View>
                    </SwiftUIRNHostView>
                </SwiftUIGroup>
            </SwiftUIBottomSheet>
        </SwiftUIHost>
    );
}

const styles = StyleSheet.create({
    sheetContent: {
        position: 'relative',
        paddingTop: 20,
        alignSelf: 'stretch',
        overflow: 'visible',
    },
    content: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',

    },
    logoArabicText: {
        textAlign: 'center',
        writingDirection: 'rtl',
    },
    logoX: {
        fontSize: 28,
    },
    logoCard: {
        fontSize: 28,
    },
    logoXArabic: {
        ...Typography.getTextVariantStyle('displayArabicBlack'),
        fontSize: 32,
        lineHeight: 40,
        writingDirection: 'rtl',
    },
    logoCardArabic: {
        ...Typography.getTextVariantStyle('displayArabicBlack'),
        fontSize: 32,
        lineHeight: 40,
        writingDirection: 'rtl',
    },
    divider: {
        height: 1,
        marginHorizontal: 20,
        alignSelf: 'stretch',
    },
    titleContainer: {
        width: '100%',
        paddingTop: 18,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 16,
    },
    titleContainerRTL: {
        direction: 'rtl',
    },
    titleText: {
        width: '100%',
        fontSize: 22,
        lineHeight: 28,
        textAlign: 'center',
    },
    titleTextRTL: {
        fontSize: 28,
        lineHeight: 36,
    },
    titleHighlight: {
        fontSize: 22,
    },
    titleHighlightRTL: {
        fontSize: 28,
    },
    stepsContainer: {
        width: '100%',
        alignSelf: 'center',
        gap: 8,
    },
    stepItem: {
        width: '100%',
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'flex-start',
        borderRadius: 16,
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 20,
        minHeight: 54,
    },
    stepItemLTR: {
        flexDirection: 'row',
    },
    stepItemRTL: {
        flexDirection: 'row-reverse',
        direction: 'rtl',
    },
    stepNumber: {
        fontSize: 28,
        lineHeight: 32,
        textAlign: 'center',
    },
    stepNumberRTL: {
        fontSize: 34,
        lineHeight: 40,
    },
    stepNumberColumn: {
        width: 42,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepText: {
        flex: 1,
        fontSize: 18,
        lineHeight: 26,
        ...Typography.getTextVariantStyle('body'),
    },
    stepTextRTL: {
        fontSize: 20,
        lineHeight: 28,
    },
});
