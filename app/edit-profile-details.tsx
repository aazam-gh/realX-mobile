import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { getAuth, updateProfile } from '@react-native-firebase/auth';
import { doc, getFirestore, updateDoc } from '@react-native-firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OnboardingFlowSectionMotion } from '../components/onboarding/OnboardingMotion';
import { OnboardingField, OnboardingPrimaryButton, OnboardingScaffold } from '../components/onboarding/OnboardingUI';
import { useAuthAccess } from '../context/AuthAccessContext';
import { useAppLocale } from '../context/LocaleContext';
import { useAppTheme } from '../context/AppThemeContext';
import { fetchStudentProfile } from '../utils/firebaseQueries';
import { logger } from '../utils/logger';
import { formatProfileDate, parseProfileDate, profileDateValue } from '../utils/profileDetails';
import { queryClient, queryKeys } from '../utils/queryClient';

type ProfileDraft = { firstName: string; lastName: string; dob: Date | null };

const DEFAULT_DATE = new Date(2000, 0, 1);

export default function EditProfileDetailsScreen() {
    const router = useRouter();
    const { theme, isDark } = useAppTheme();
    const { t } = useTranslation();
    const { isAuthenticated, loading: authAccessLoading, requireAuth } = useAuthAccess();
    const { isRTL } = useAppLocale();
    const user = getAuth().currentUser;
    const userId = user?.uid ?? null;
    const initializedForUser = useRef<string | null>(null);
    const [initialDraft, setInitialDraft] = useState<ProfileDraft | null>(null);
    const [draft, setDraft] = useState<ProfileDraft>({ firstName: '', lastName: '', dob: null });
    const [fieldErrors, setFieldErrors] = useState<{ firstName?: string; lastName?: string }>({});
    const [isSaving, setIsSaving] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateDraft, setDateDraft] = useState<Date>(DEFAULT_DATE);

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

    useEffect(() => {
        if (!userId || !studentProfile || initializedForUser.current === userId) return;
        const nextDraft = {
            firstName: studentProfile.firstName || '',
            lastName: studentProfile.lastName || '',
            dob: parseProfileDate(studentProfile.dob),
        };
        initializedForUser.current = userId;
        setInitialDraft(nextDraft);
        setDraft(nextDraft);
    }, [studentProfile, userId]);

    const hasUnsavedChanges = useMemo(() => {
        if (!initialDraft) return false;
        return draft.firstName.trim() !== initialDraft.firstName.trim()
            || draft.lastName.trim() !== initialDraft.lastName.trim()
            || profileDateValue(draft.dob) !== profileDateValue(initialDraft.dob);
    }, [draft, initialDraft]);

    const exitEditor = () => {
        if (router.canGoBack()) router.back();
        else router.replace('/profile-details' as any);
    };

    const confirmDiscard = () => {
        if (isSaving || !hasUnsavedChanges) {
            if (!isSaving) exitEditor();
            return;
        }
        Alert.alert(t('discard_changes_title'), t('discard_changes_message'), [
            { text: t('cancel'), style: 'cancel' },
            { text: t('discard_changes'), style: 'destructive', onPress: exitEditor },
        ]);
    };

    const openDatePicker = () => {
        setDateDraft(draft.dob || DEFAULT_DATE);
        setShowDatePicker(true);
    };

    const onDateValueChange = (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
            setDraft((current) => ({ ...current, dob: selectedDate }));
            return;
        }
        setDateDraft(selectedDate);
    };

    const confirmDate = () => {
        setDraft((current) => ({ ...current, dob: dateDraft }));
        setShowDatePicker(false);
    };

    const handleSave = async () => {
        const nextErrors = {
            firstName: draft.firstName.trim() ? undefined : t('first_name_required'),
            lastName: draft.lastName.trim() ? undefined : t('last_name_required'),
        };
        setFieldErrors(nextErrors);
        if (nextErrors.firstName || nextErrors.lastName) return;

        const currentUser = getAuth().currentUser;
        if (!currentUser) return;
        setIsSaving(true);
        try {
            const updatedData = {
                firstName: draft.firstName.trim(),
                lastName: draft.lastName.trim(),
                dob: profileDateValue(draft.dob),
                updatedAt: new Date(),
            };
            await updateDoc(doc(getFirestore(), 'students', currentUser.uid), updatedData);
            queryClient.setQueryData(queryKeys.studentProfile(currentUser.uid), (previous: any) => ({ ...(previous || {}), ...updatedData }));
            await updateProfile(currentUser, { displayName: `${updatedData.firstName} ${updatedData.lastName}` });
            router.navigate({ pathname: '/profile-details', params: { updated: '1' } } as any);
        } catch (error) {
            logger.error('Error updating profile:', error);
            Alert.alert(t('error'), t('profile_update_failure'));
        } finally {
            setIsSaving(false);
        }
    };

    const email = studentProfile?.email || user?.email || '';

    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} animated />
            <OnboardingScaffold
                headerTitle={t('edit_profile_title')}
                onBack={confirmDiscard}
                headerAction={{ label: t('cancel'), onPress: confirmDiscard, disabled: isSaving }}
                footer={<OnboardingPrimaryButton label={t('save')} loadingLabel={t('save')} loading={isSaving} disabled={isLoading || !initialDraft} onPress={() => void handleSave()} />}
            >
            {isLoading ? <ActivityIndicator size="large" color={theme.brand} style={styles.loader} /> : (
                <OnboardingFlowSectionMotion delay={80} style={styles.form}>
                    <OnboardingField
                        label={t('first_name')}
                        value={draft.firstName}
                        onChangeText={(firstName) => { setDraft((current) => ({ ...current, firstName })); setFieldErrors((current) => ({ ...current, firstName: undefined })); }}
                        placeholder={t('first_name_placeholder')}
                        autoComplete="given-name"
                        textContentType="givenName"
                        editable={!isSaving}
                        error={fieldErrors.firstName}
                        textAlign={isRTL ? 'right' : 'left'}
                    />
                    <OnboardingField
                        label={t('last_name')}
                        value={draft.lastName}
                        onChangeText={(lastName) => { setDraft((current) => ({ ...current, lastName })); setFieldErrors((current) => ({ ...current, lastName: undefined })); }}
                        placeholder={t('last_name_placeholder')}
                        autoComplete="family-name"
                        textContentType="familyName"
                        editable={!isSaving}
                        error={fieldErrors.lastName}
                        textAlign={isRTL ? 'right' : 'left'}
                    />
                    <View style={styles.fieldWrap}>
                        <Text style={[styles.fieldLabel, { color: theme.text }, isRTL && styles.textRTL]}>{t('date_of_birth')}</Text>
                        <TouchableOpacity accessibilityRole="button" onPress={openDatePicker} disabled={isSaving} activeOpacity={0.82} style={[styles.dateInput, { backgroundColor: theme.cardMuted, borderColor: theme.border, opacity: isSaving ? 0.58 : 1 }]}>
                            <Text style={[styles.dateValue, { color: draft.dob ? theme.text : theme.inputPlaceholder, textAlign: isRTL ? 'right' : 'left' }]}>{formatProfileDate(draft.dob)}</Text>
                            <Text style={[styles.dateAction, { color: theme.brandText }]}>{t('edit')}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.emailNotice, { backgroundColor: theme.cardMuted, borderColor: theme.border }, isRTL && styles.emailNoticeRTL]}>
                        <Text style={[styles.emailNoticeLabel, { color: theme.mutedText }, isRTL && styles.textRTL]}>{t('account_information')}</Text>
                        <Text selectable style={[styles.emailNoticeValue, { color: theme.text }, isRTL && styles.textRTL]}>{email || t('email_address_placeholder')}</Text>
                    </View>
                </OnboardingFlowSectionMotion>
            )}

            {Platform.OS === 'ios' ? (
                <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
                    <View style={styles.modalBackdrop}>
                        <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowDatePicker(false)} accessibilityRole="button" accessibilityLabel={t('cancel')} />
                        <View style={[styles.dateSheet, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                            <View style={[styles.dateSheetHeader, isRTL && styles.dateSheetHeaderRTL]}>
                                <Text style={[styles.dateSheetTitle, { color: theme.text }, isRTL && styles.textRTL]}>{t('date_picker_title')}</Text>
                                <TouchableOpacity onPress={() => setShowDatePicker(false)} accessibilityRole="button" style={styles.sheetAction}><Text style={[styles.sheetActionText, { color: theme.mutedText }]}>{t('cancel')}</Text></TouchableOpacity>
                            </View>
                            <DateTimePicker value={dateDraft} mode="date" display="spinner" onValueChange={onDateValueChange} maximumDate={new Date()} textColor={theme.text} />
                            <TouchableOpacity onPress={confirmDate} accessibilityRole="button" style={[styles.doneButton, { backgroundColor: theme.actionSolid }]}><Text style={[styles.doneButtonText, { color: theme.onActionSolid }]}>{t('done')}</Text></TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            ) : showDatePicker ? <DateTimePicker value={dateDraft} mode="date" display="default" onValueChange={onDateValueChange} onDismiss={() => setShowDatePicker(false)} maximumDate={new Date()} /> : null}
            </OnboardingScaffold>
        </>
    );
}

const styles = StyleSheet.create({
    loader: { marginVertical: 40 },
    form: { gap: 16 },
    fieldWrap: { gap: 8 },
    fieldLabel: { fontSize: 14, lineHeight: 20, fontFamily: 'Poppins' },
    dateInput: { minHeight: 56, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    dateValue: { flex: 1, fontSize: 16, lineHeight: 24, fontFamily: 'Poppins' },
    dateAction: { fontSize: 14, lineHeight: 20, fontFamily: 'Poppins' },
    emailNotice: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 4 },
    emailNoticeRTL: { alignItems: 'flex-end' },
    emailNoticeLabel: { fontSize: 12, lineHeight: 18, fontFamily: 'Poppins' },
    emailNoticeValue: { fontSize: 15, lineHeight: 22, fontFamily: 'Poppins' },
    modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.42)' },
    dateSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, gap: 8 },
    dateSheetHeader: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dateSheetHeaderRTL: { flexDirection: 'row-reverse' },
    dateSheetTitle: { fontSize: 17, lineHeight: 24, fontFamily: 'Poppins' },
    sheetAction: { minHeight: 44, paddingHorizontal: 4, justifyContent: 'center' },
    sheetActionText: { fontSize: 15, lineHeight: 22, fontFamily: 'Poppins' },
    doneButton: { minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
    doneButtonText: { fontSize: 16, lineHeight: 23, fontFamily: 'Poppins' },
    textRTL: { textAlign: 'right', writingDirection: 'rtl' },
});
