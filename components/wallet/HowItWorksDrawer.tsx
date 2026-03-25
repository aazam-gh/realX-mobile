import { GlassView } from 'expo-glass-effect';
import {
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

const STEPS: StepData[] = [
    { number: '1', text: 'Choose a brand' },
    { number: '2', text: 'Pick a gift card value' },
    { number: '3', text: 'Tap Redeem to generate it' },
    { number: '4', text: 'Show the gift card at checkout' },
    { number: '5', text: 'Enjoy your savings', emoji: '🎉' },
];

function StepItem({ step }: { step: StepData }) {
    return (
        <View style={styles.stepItem}>
            <PhonkText style={styles.stepNumber}>{step.number}</PhonkText>
            <Text style={styles.stepText}>
                {step.text}
                {step.emoji && ` ${step.emoji}`}
            </Text>
        </View>
    );
}

export default function HowItWorksDrawer({ visible, onClose }: Props) {
    const insets = useSafeAreaInsets();

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
                        <View style={styles.logoContainer}>
                            <PhonkText style={styles.logoX}>X</PhonkText>
                            <PhonkText style={styles.logoCard}>CARD</PhonkText>
                        </View>

                        {/* Divider */}
                        <View style={styles.divider} />

                        {/* Title */}
                        <View style={styles.titleContainer}>
                            <PhonkText style={styles.titleText}>HOW DOES </PhonkText>
                            <PhonkText style={styles.titleHighlight}>THIS</PhonkText>
                            <PhonkText style={styles.titleText}> WORK?</PhonkText>
                        </View>

                        {/* Steps */}
                        <View style={styles.stepsContainer}>
                            {STEPS.map((step) => (
                                <StepItem key={step.number} step={step} />
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
    stepNumber: {
        fontSize: 22,
        color: '#18B852',
        marginRight: 16,
        minWidth: 24,
    },
    stepText: {
        fontSize: 16,
        fontFamily: Typography.poppins.medium,
        color: '#000000',
        flex: 1,
    },
});
