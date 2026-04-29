import { GlassView } from 'expo-glass-effect';
import {
    Dimensions,
    I18nManager,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Typography } from '../../constants/Typography';
import PhonkText from '../PhonkText';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type Props = {
    visible: boolean;
    onClose: () => void;
};

type StepData = {
    number: string;
    text: string;
    emoji?: string;
};

type StepItemProps = {
    step: StepData;
    isRTL: boolean;
};

function StepItem({ step, isRTL }: StepItemProps) {
    return (
        <View style={[styles.stepItem, isRTL && styles.stepItemRTL]}>
            <PhonkText style={styles.stepNumber}>
                {step.number}
            </PhonkText>
            <View style={styles.stepNumberSpacer} />
            <Text style={[styles.stepText, { textAlign: isRTL ? 'right' : 'left' }]}>
                {step.text}
                {step.emoji && ` ${step.emoji}`}
            </Text>
        </View>
    );
}

export default function HowItWorksDrawer({ visible, onClose }: Props) {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const isRTL = I18nManager.isRTL;

    const steps: StepData[] = [
        { number: '1', text: t('how_it_works_step_1') },
        { number: '2', text: t('how_it_works_step_2') },
        { number: '3', text: t('how_it_works_step_3') },
        { number: '4', text: t('how_it_works_step_4') },
        { number: '5', text: t('how_it_works_step_5') },
    ];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <GlassView style={StyleSheet.absoluteFill} glassEffectStyle="regular" colorScheme="dark" tintColor="rgba(0,0,0,0.3)" />
                <Pressable
                    style={[
                        styles.drawerContainer,
                        { paddingBottom: insets.bottom + 20 },
                    ]}
                    onPress={(e) => e.stopPropagation()}
                >
                    {/* Drawer Handle */}
                    <View style={styles.handleContainer}>
                        <View style={styles.handle} />
                    </View>

                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        {/* Logo */}
                        <View style={[styles.logoContainer, isRTL && styles.logoContainerRTL]}>
                            <PhonkText style={styles.logoX}>{t('xcard_title_x')}</PhonkText>
                            <PhonkText style={styles.logoCard}>{t('xcard_title_card')}</PhonkText>
                        </View>

                        {/* Divider */}
                        <View style={styles.divider} />

                        {/* Title */}
                        <View
                            style={[
                                styles.titleContainer,
                                isRTL && styles.titleContainerRTL,
                            ]}
                        >
                            <PhonkText style={styles.titleText}>{t('how_it_works_title_prefix')}</PhonkText>
                            <PhonkText style={styles.titleHighlight}>{t('how_it_works_title_highlight')}</PhonkText>
                            <PhonkText style={styles.titleText}>{t('how_it_works_title_suffix')}</PhonkText>
                        </View>

                        {/* Steps */}
                        <View style={styles.stepsContainer}>
                            {steps.map((step) => (
                                <StepItem key={step.number} step={step} isRTL={isRTL} />
                            ))}
                        </View>
                    </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
    },
    drawerContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: SCREEN_HEIGHT * 0.85,
    },
    handleContainer: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 8,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
    },
    content: {
        paddingHorizontal: 24,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 20,
        paddingBottom: 24,
    },
    logoContainerRTL: {
        flexDirection: 'row-reverse',
    },
    logoX: {
        fontSize: 28,
        color: '#18B852',
    },
    logoCard: {
        fontSize: 28,
        color: '#000000',
    },
    divider: {
        height: 1,
        backgroundColor: '#E8E8E8',
        marginHorizontal: 20,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 28,
        paddingBottom: 24,
    },
    titleContainerRTL: {
        flexDirection: 'row-reverse',
    },
    titleText: {
        fontSize: 22,
        color: '#000000',
    },
    titleHighlight: {
        fontSize: 22,
        color: '#18B852',
    },
    stepsContainer: {
        gap: 12,
        paddingBottom: 20,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 20,
    },
    stepItemRTL: {
        flexDirection: 'row-reverse',
        paddingLeft: 12,
    },
    stepNumber: {
        fontSize: 22,
        color: '#18B852',
    },
    stepNumberRTL: {
    },
    stepNumberSpacer: {
        width: 12,
    },
    stepText: {
        fontSize: 16,
        fontFamily: Typography.poppins.medium,
        color: '#000000',
        flex: 1,
    },
});
