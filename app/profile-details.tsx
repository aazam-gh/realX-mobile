import { deleteUser, getAuth, signOut } from '@react-native-firebase/auth';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OnboardingFlowSectionMotion } from '../components/onboarding/OnboardingMotion';
import { InlineNotice, OnboardingScaffold } from '../components/onboarding/OnboardingUI';
import UserAvatar from '../components/UserAvatar';
import ResponsiveText from '../components/ResponsiveText';
import { useAuthAccess } from '../context/AuthAccessContext';
import { useAppLocale } from '../context/LocaleContext';
import { useAppTheme } from '../context/AppThemeContext';
import { fetchStudentProfile } from '../utils/firebaseQueries';
import { logger } from '../utils/logger';
import { formatProfileDate, parseProfileDate } from '../utils/profileDetails';
import { unregisterExpoPushTokenForCurrentUser } from '../utils/pushNotifications';
import { queryKeys } from '../utils/queryClient';

type ProfileInfoRowProps = {
    label: string;
    value: string;
    isRTL: boolean;
};

function ProfileInfoRow({ label, value, isRTL }: ProfileInfoRowProps) {
    const { theme } = useAppTheme();

    return (
        <View style={[styles.infoRow, { backgroundColor: theme.cardMuted, borderColor: theme.border }, isRTL && styles.infoRowRTL]}>
            <Text style={[styles.infoLabel, { color: theme.mutedText }, isRTL && styles.textRTL]}>{label}</Text>
            <Text selectable style={[styles.infoValue, { color: theme.text }, isRTL && styles.textRTL]}>{value}</Text>
        </View>
    );
}

export default function ProfileDetailsScreen() {
    const router = useRouter();
    const { updated } = useLocalSearchParams<{ updated?: string }>();
    const { theme } = useAppTheme();
    const { t } = useTranslation();
    const { isAuthenticated, loading: authAccessLoading, requireAuth } = useAuthAccess();
    const { isRTL } = useAppLocale();
    const [isDeleting, setIsDeleting] = useState(false);
    const user = getAuth().currentUser;
    const userId = user?.uid ?? null;

    useEffect(() => {
        if (authAccessLoading || isAuthenticated) return;
        requireAuth('guest_profile_edit_message');
        router.replace('/(tabs)/profile' as any);
    }, [authAccessLoading, isAuthenticated, requireAuth, router]);

    const { data: studentProfile, error: studentProfileError, isLoading } = useQuery({
        queryKey: userId ? queryKeys.studentProfile(userId) : ['studentProfile', 'anonymous'],
        queryFn: () => userId ? fetchStudentProfile(userId) : Promise.resolve(null),
        enabled: !!userId,
    });

    useEffect(() => {
        if (!authAccessLoading && isAuthenticated && !user) router.replace('/(onboarding)' as any);
    }, [authAccessLoading, isAuthenticated, router, user]);

    useEffect(() => {
        if (!studentProfileError) return;
        logger.error('Error fetching user data:', studentProfileError);
        Alert.alert(t('error'), t('profile_load_failed'));
    }, [studentProfileError, t]);

    const firstName = studentProfile?.firstName || '';
    const lastName = studentProfile?.lastName || '';
    const email = studentProfile?.email || user?.email || '';
    const photoURL = studentProfile?.photoURL || user?.photoURL || null;
    const role = studentProfile?.role || null;
    const displayName = [firstName, lastName].filter(Boolean).join(' ') || t('user');
    const dateOfBirth = formatProfileDate(parseProfileDate(studentProfile?.dob));

    const handleDeleteAccount = () => {
        Alert.alert(t('delete_account'), t('delete_account_confirmation'), [
            { text: t('cancel'), style: 'cancel' },
            {
                text: t('delete_account_permanently'),
                style: 'destructive',
                onPress: async () => {
                    const authInstance = getAuth();
                    const currentUser = authInstance.currentUser;
                    if (!currentUser) return;
                    setIsDeleting(true);
                    try {
                        await unregisterExpoPushTokenForCurrentUser();
                        await deleteUser(currentUser);
                        try { await signOut(authInstance); } catch { /* Auth user is already deleted. */ }
                        Alert.alert(t('delete_account_success_title'), t('delete_account_success_message'));
                        router.replace('/(onboarding)');
                    } catch (error: any) {
                        logger.error('Error deleting account:', error);
                        if (error.code === 'auth/requires-recent-login') {
                            Alert.alert(t('security_reauth_required'), t('security_reauth_message'), [{ text: t('ok') }]);
                        } else {
                            Alert.alert(t('error'), t('delete_account_failure'));
                        }
                    } finally {
                        setIsDeleting(false);
                    }
                },
            },
        ]);
    };

    return (
        <OnboardingScaffold
            headerTitle={t('profile_details_title')}
            onBack={() => router.back()}
            headerAction={{ label: t('edit'), onPress: () => router.push('/edit-profile-details' as any), disabled: isLoading || isDeleting }}
        >
            <OnboardingFlowSectionMotion delay={65} style={[styles.identityCard, isRTL && styles.identityCardRTL]}>
                <View style={[styles.avatarRing, { backgroundColor: theme.brandSoft, borderColor: theme.border }]}>
                    <UserAvatar firstName={firstName} lastName={lastName} email={email} photoURL={photoURL} role={role} seed={userId || undefined} size={112} style={styles.avatarMain} />
                </View>
                <View style={[styles.identityCopy, isRTL && styles.identityCopyRTL]}>
                    <ResponsiveText selectable style={[styles.identityName, { color: theme.text }, isRTL && styles.textRTL]}>{displayName}</ResponsiveText>
                    <Text selectable style={[styles.identityEmail, { color: theme.mutedText }, isRTL && styles.textRTL]}>{email || t('email_address_placeholder')}</Text>
                </View>
            </OnboardingFlowSectionMotion>

            {updated === '1' ? <InlineNotice tone="success">{t('profile_update_success')}</InlineNotice> : null}

            {isLoading ? <ActivityIndicator size="large" color={theme.brand} style={styles.loader} /> : (
                <OnboardingFlowSectionMotion delay={110} style={styles.content}>
                    <ResponsiveText variant="bodyStrong" style={[styles.sectionTitle, { color: theme.text }, isRTL && styles.textRTL]}>{t('personal_information')}</ResponsiveText>
                    <View style={styles.infoList}>
                        <ProfileInfoRow label={t('first_name')} value={firstName || t('first_name_placeholder')} isRTL={isRTL} />
                        <ProfileInfoRow label={t('last_name')} value={lastName || t('last_name_placeholder')} isRTL={isRTL} />
                        <ProfileInfoRow label={t('date_of_birth')} value={dateOfBirth} isRTL={isRTL} />
                    </View>
                    <ResponsiveText variant="bodyStrong" style={[styles.sectionTitle, { color: theme.text }, isRTL && styles.textRTL]}>{t('account_information')}</ResponsiveText>
                    <ProfileInfoRow label={t('email_address')} value={email || t('email_address_placeholder')} isRTL={isRTL} />
                    <View style={[styles.dangerZone, { borderTopColor: theme.border }]}>
                        <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: isDeleting }} disabled={isDeleting} onPress={handleDeleteAccount} activeOpacity={0.75} style={[styles.deleteButton, { borderColor: theme.danger, opacity: isDeleting ? 0.45 : 1 }]}>
                            <Text style={[styles.deleteButtonText, { color: theme.danger }]}>{t('delete_account')}</Text>
                        </TouchableOpacity>
                    </View>
                </OnboardingFlowSectionMotion>
            )}
        </OnboardingScaffold>
    );
}

const styles = StyleSheet.create({
    identityCard: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: -18 },
    identityCardRTL: { flexDirection: 'row-reverse' },
    avatarRing: { width: 104, height: 104, borderRadius: 52, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    avatarMain: { borderWidth: 3, borderColor: '#FFFFFF' },
    identityCopy: { flex: 1, alignItems: 'flex-start', gap: 4 },
    identityCopyRTL: { alignItems: 'flex-end' },
    identityName: { fontSize: 18, lineHeight: 25 },
    identityEmail: { fontSize: 13, lineHeight: 19, fontFamily: 'Poppins' },
    loader: { marginVertical: 40 },
    content: { gap: 12 },
    sectionTitle: { fontSize: 15, lineHeight: 22 },
    infoList: { gap: 8 },
    infoRow: { minHeight: 66, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 11, gap: 3 },
    infoRowRTL: { alignItems: 'flex-end' },
    infoLabel: { fontSize: 12, lineHeight: 18, fontFamily: 'Poppins' },
    infoValue: { fontSize: 16, lineHeight: 23, fontFamily: 'Poppins' },
    dangerZone: { marginTop: 16, paddingTop: 24, borderTopWidth: StyleSheet.hairlineWidth },
    deleteButton: { minHeight: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
    deleteButtonText: { fontSize: 13, lineHeight: 19, fontFamily: 'Poppins' },
    textRTL: { textAlign: 'right', writingDirection: 'rtl' },
});
