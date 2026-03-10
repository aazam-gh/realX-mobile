import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../constants/Typography';

export default function PrivacyScreen() {
    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <Text style={styles.lastUpdated}>Last Updated: March 11, 2026</Text>

                <View style={styles.section}>
                    <Text style={styles.paragraph}>
                        Realx for Software LLC (RealX, we, us, or our) values the privacy of all users of our services, including students of all ages. This Privacy Policy explains how we collect, use, store, and share information when you access or use our mobile application, website, or related services (collectively, the Services). By using the Services, you agree to the terms outlined in this Privacy Policy. If you do not agree with any part of this Privacy Policy, you should not use the Services.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Information We Collect</Text>
                    <Text style={styles.paragraph}>
                        To provide the RealX Services, we collect information from you in several ways. First, we collect personal information you provide directly, such as your name, email address, school or university, student verification documents, account credentials, and any preferences you set within the app. This information is necessary for creating your account, verifying your student status, and allowing you to access eligible offers.
                    </Text>
                    <Text style={styles.paragraph}>
                        We may also collect certain information automatically when you use the Services. This includes device type, operating system, IP address, mobile network information, app usage patterns, login times, and location data. This information helps us maintain the security of the platform, improve the Services, detect fraud, and provide anonymized analytics to our merchant partners.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Student Verification</Text>
                    <Text style={styles.paragraph}>
                        RealX is a platform that verifies student status for brands and merchants. As part of the verification process, we may request information such as school-issued email addresses, student ID numbers, or other documents confirming enrollment. For users under 18, parental or guardian consent is required for verification. Parents or guardians may provide or review the information submitted on behalf of their child. We retain this verification information only as long as necessary to provide the Services and comply with legal obligations.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How We Use Information</Text>
                    <Text style={styles.paragraph}>
                        We use the information we collect for several purposes, including:
                    </Text>
                    <Text style={styles.paragraph}>• To create and manage user accounts and verify student eligibility.</Text>
                    <Text style={styles.paragraph}>• To provide and improve the Services, including app functionality, user interface, and security.</Text>
                    <Text style={styles.paragraph}>• To analyze aggregated and anonymized data and provide insights to participating brands about student engagement with offers.</Text>
                    <Text style={styles.paragraph}>• To communicate with you regarding your account, student verification, and relevant updates or promotions.</Text>
                    <Text style={styles.paragraph}>• To detect, prevent, and respond to fraudulent or unauthorized activity.</Text>
                    <Text style={styles.paragraph}>• To comply with legal or regulatory obligations.</Text>
                    <Text style={styles.paragraph}>
                        We do not use personal information to make automated decisions about individual users beyond the verification process.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sharing Information</Text>
                    <Text style={styles.paragraph}>RealX may share information in the following ways:</Text>
                    <Text style={styles.paragraph}>
                        • With merchants and brands: We provide aggregated or anonymized analytics to brands about how offers are redeemed or engaged with. This does not include personally identifiable information of minors without parental consent. Individual verification status may be shared with merchants solely to confirm eligibility for offers.
                    </Text>
                    <Text style={styles.paragraph}>
                        • With service providers: We may share information with third-party vendors who help us provide the Services, such as cloud storage providers, email platforms, and analytics services. These providers are bound by confidentiality agreements and are permitted to use information only for the services they provide to RealX.
                    </Text>
                    <Text style={styles.paragraph}>
                        • Legal obligations: We may disclose information when required to comply with legal obligations, respond to lawful requests, or protect the rights, property, or safety of RealX, users, or others.
                    </Text>
                    <Text style={styles.paragraph}>
                        • Business transfers: In the event of a merger, acquisition, or sale of assets, user information may be transferred as part of the business assets.
                    </Text>
                    <Text style={styles.paragraph}>We do not sell your personal information to third parties.</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Privacy of Minors</Text>
                    <Text style={styles.paragraph}>
                        RealX takes the privacy of minors very seriously. Users under 18 must have parental or guardian consent to use the Services. We require parental review and approval before minors can submit verification documents or access certain features. Parents/guardians may review, correct, or delete their child’s information, or request account termination. We do not share personally identifiable information of minors with merchants or other third parties without parental consent.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Cookies and Tracking Technologies</Text>
                    <Text style={styles.paragraph}>
                        We use cookies, web beacons, pixels, and similar technologies to collect information about your use of the Services. These technologies help us maintain security, improve user experience, analyze trends, and understand usage patterns. We may also allow third-party service providers to use tracking technologies for analytics and insights into offer engagement. You may manage or disable cookies through your device or browser settings, though this may affect your ability to fully use the Services.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Third-Party Services and Social Logins</Text>
                    <Text style={styles.paragraph}>
                        Some features of the Services allow registration or login via third-party accounts, such as Google or Apple. When you use social login, we may receive certain profile information from the third-party provider, such as name, email address, and profile picture. This information is used solely for authentication and account setup. RealX is not responsible for the privacy practices, content, or security of third-party providers. Users are encouraged to review their privacy policies before using social logins.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Data Retention</Text>
                    <Text style={styles.paragraph}>
                        We retain your information only as long as necessary to provide the Services, comply with legal obligations, resolve disputes, and enforce our agreements. Once the data is no longer needed, it will be securely deleted or anonymized. In some cases, backup systems may retain information temporarily, but access is restricted to ensure privacy.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>User Rights</Text>
                    <Text style={styles.paragraph}>
                        You have the right to access, review, update, or delete your personal information. Parents or guardians can exercise these rights on behalf of minors. You may also withdraw consent to our processing of your information at any time, subject to legal or contractual restrictions. To exercise these rights, contact us at info@realx.qa. We will respond to requests in accordance with applicable laws.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security</Text>
                    <Text style={styles.paragraph}>
                        RealX implements reasonable administrative, technical, and physical safeguards to protect the personal information of users. While we strive to protect your information, no method of transmission or storage is completely secure, and we cannot guarantee absolute security. Users should also take care to maintain the confidentiality of account credentials.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Changes to the Privacy Policy</Text>
                    <Text style={styles.paragraph}>
                        We may update this Privacy Policy periodically to reflect changes in the Services, legal requirements, or best practices. The “Last Updated” date at the top indicates the most recent version. Users are encouraged to review the Privacy Policy regularly. Continued use of the Services after updates constitutes acceptance of the revised policy.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Information</Text>
                    <Text style={styles.paragraph}>
                        If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information, you may contact us at:
                    </Text>
                    <Text style={styles.paragraph}>
                        Realx for Software LLC{"\n"}
                        Email: info@realx.qa
                    </Text>
                    <Text style={styles.paragraph}>
                        Parents and guardians may contact us regarding minors’ accounts at the same address.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        gap: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: Typography.metropolis.semiBold,
        color: '#000',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 40,
    },
    lastUpdated: {
        fontSize: 14,
        fontFamily: Typography.metropolis.medium,
        color: '#999',
        marginBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Typography.metropolis.semiBold,
        color: '#000',
        marginBottom: 12,
    },
    paragraph: {
        fontSize: 16,
        fontFamily: Typography.metropolis.medium,
        color: '#666',
        lineHeight: 24,
    },
});
