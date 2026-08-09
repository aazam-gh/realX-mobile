import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../context/AppThemeContext';
import { useAppLocale } from '../../context/LocaleContext';
import { Typography } from '../../constants/Typography';
import AndroidBottomSheetModal from '../AndroidBottomSheetModal';
import { BottomSheetOverscanBackground, getBottomSheetBackgroundModifiers } from '../../utils/expoUiBottomSheet';

type Props = {
    visible: boolean;
    onClose: () => void;
};

const TERM_KEYS = [
    'in_store_only',
    'cannot_be_combined',
    'xp_promotional_reward',
    'xp_no_cash_withdrawal',
    'xp_in_app_only',
] as const;

export default function RewardsTermsDrawer({ visible, onClose }: Props) {
    const { width } = useWindowDimensions();
    const { t } = useTranslation();
    const { theme } = useAppTheme();
    const { isRTL } = useAppLocale();
    const backgroundModifiers = React.useMemo(
        () => getBottomSheetBackgroundModifiers(theme.surfaceElevated),
        [theme.surfaceElevated],
    );

    const sheetBody = (
        <View style={styles.content}>
            <View style={styles.termsContainer}>
                {TERM_KEYS.map((key) => (
                    <View
                        key={key}
                        style={[
                            styles.termItem,
                            { backgroundColor: theme.cardMuted },
                            isRTL ? styles.termItemRTL : styles.termItemLTR,
                        ]}
                    >
                        <View style={[styles.termIcon, { backgroundColor: theme.brand }]}> 
                            <Ionicons name="checkmark" size={20} color={theme.onActionSolid} />
                        </View>
                        <Text
                            style={[
                                styles.termText,
                                { color: theme.text },
                                isRTL && styles.rtlText,
                            ]}
                        >
                            {t(key)}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );

    if (Platform.OS === 'android') {
        return (
            <AndroidBottomSheetModal visible={visible} onClose={onClose} backgroundColor={theme.surfaceElevated} testID="rewards-terms-bottom-sheet">
                <View style={styles.sheetContent}>{sheetBody}</View>
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
            <SwiftUIBottomSheet isPresented={visible} onIsPresentedChange={(presented: boolean) => { if (!presented) onClose(); }} fitToContents testID="rewards-terms-bottom-sheet">
                <SwiftUIGroup modifiers={[frame({ maxWidth: Infinity, alignment: 'topLeading' }), presentationDragIndicator('visible'), ...(backgroundModifiers ?? [])]}>
                    <SwiftUIRNHostView matchContents>
                        <View style={[styles.sheetContent, { backgroundColor: theme.surfaceElevated, width, paddingBottom: 8 }]}> 
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
    sheetContent: { position: 'relative', overflow: 'visible', paddingTop: 20 },
    content: { width: '100%', alignItems: 'center', paddingHorizontal: 20 },
    rtlText: { textAlign: 'right', writingDirection: 'rtl' },
    termsContainer: { width: '100%', gap: 8 },
    termItem: {
        width: '100%',
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'flex-start',
        borderRadius: 20,
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        minHeight: 68,
    },
    termItemLTR: { flexDirection: 'row' },
    termItemRTL: { flexDirection: 'row-reverse', direction: 'rtl' },
    termIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
    termText: {
        flex: 1,
        fontSize: 16,
        lineHeight: 23,
        ...Typography.getTextVariantStyle('body'),
    },
});
