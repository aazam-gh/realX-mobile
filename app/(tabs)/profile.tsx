import { Ionicons } from '@expo/vector-icons';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  I18nManager,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '../../components/ThemedText';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useTheme } from '../../context/ThemeContext';
import i18n, { setStoredLanguage } from '../../src/localization/i18n';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [userData, setUserData] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    photoURL?: string;
    role?: string;
    creatorCode?: string;
    cashback?: number;
  } | null>(null);

  useEffect(() => {
    const authInstance = getAuth();
    const user = authInstance.currentUser;
    if (!user) return;

    const db = getFirestore();
    const studentDocRef = doc(db, 'students', user.uid);

    const unsubscribe = onSnapshot(studentDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data() as any);
      }
    });

    return () => unsubscribe();
  }, []);

  const changeLanguage = async (lang: 'en' | 'ar') => {
    try {
      await setStoredLanguage(lang);
      await i18n.changeLanguage(lang);

      const shouldBeRTL = lang === 'ar';
      if (I18nManager.isRTL !== shouldBeRTL) {
        I18nManager.allowRTL(shouldBeRTL);
        I18nManager.forceRTL(shouldBeRTL);
        Alert.alert(t('restart_required'), t('restart_required_message'));
        return;
      }

      Alert.alert(t('language_changed'), lang === 'ar' ? t('arabic') : t('english'));
    } catch (error) {
      console.log('Language change error:', error);
      Alert.alert(t('error'), t('could_not_change_language'));
    }
  };

  const openLanguageMenu = () => {
    Alert.alert(t('choose_language'), t('select_preferred_language'), [
      { text: t('english'), onPress: () => changeLanguage('en') },
      { text: t('arabic'), onPress: () => changeLanguage('ar') },
      { text: t('cancel'), style: 'cancel' },
    ]);
  };

  const handleLogout = () => {
    Alert.alert(t('log_out'), t('logout_confirmation'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('log_out'),
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(getAuth());
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert(t('error'), t('logout_failed'));
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText style={styles.headerText}>
            {t('manage_your')}{' '}
            <ThemedText style={styles.greenText}>{t('profile')}</ThemedText>
          </ThemedText>
        </View>

        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.7}
          onPress={() => router.push('/profile-details')}
        >
          <View style={styles.profileInfo}>
            <View style={styles.avatar}>
              {userData?.photoURL || getAuth().currentUser?.photoURL ? (
                <Image
                  source={{ uri: userData?.photoURL || getAuth().currentUser?.photoURL || undefined }}
                  style={styles.avatar}
                />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    {
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: '#F5F5F5',
                    },
                  ]}
                >
                  <Ionicons name="person" size={32} color="#CCC" />
                </View>
              )}
            </View>

            <View style={styles.nameContainer}>
              <ThemedText style={styles.userName}>
                {userData ? `${userData.firstName} ${userData.lastName}` : t('loading')}
              </ThemedText>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>{t('savings_tracker')}</ThemedText>
        </View>

        <View
          style={[
            styles.savingsCard,
            { backgroundColor: theme.background, borderColor: theme.subtitle + '20' },
          ]}
        >
          <View style={styles.savingsInfo}>
            <ThemedText type="subtitle" style={styles.savingsLabel}>
              {t('cashback_balance')}
            </ThemedText>
            <ThemedText style={styles.savingsAmount}>
              <ThemedText style={styles.greenAmount}>{userData?.cashback ?? 0}</ThemedText> QAR
            </ThemedText>
          </View>
        </View>

        {userData?.role === 'creator' && userData?.creatorCode && (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>{t('creator_code')}</ThemedText>
            </View>

            <View
              style={[
                styles.savingsCard,
                { backgroundColor: theme.background, borderColor: theme.subtitle + '20' },
              ]}
            >
              <View style={styles.savingsInfo}>
                <ThemedText type="subtitle" style={styles.savingsLabel}>
                  {t('your_creator_code')}
                </ThemedText>
                <ThemedText style={styles.savingsAmount}>
                  <ThemedText style={styles.greenAmount}>{userData.creatorCode}</ThemedText>
                </ThemedText>
              </View>
            </View>
          </>
        )}

        <View style={styles.menuContainer}>
          <MenuItem icon="time-outline" label={t('redemption_history')} />
          <MenuItem icon="language-outline" label={t('change_language')} onPress={openLanguageMenu} />
          <MenuItem
            icon="mail-outline"
            label={t('contact_us')}
            onPress={() => Linking.openURL('mailto:info@realx.qa')}
          />
          <MenuItem
            icon="document-text-outline"
            label={t('terms_and_conditions')}
            onPress={() => router.push('/terms')}
          />
          <MenuItem
            icon="shield-checkmark-outline"
            label={t('privacy_policy')}
            onPress={() => router.push('/privacy')}
          />
          <MenuItem
            icon="log-out-outline"
            label={t('log_out')}
            onPress={handleLogout}
            color="#FF3B30"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  color?: string;
}) {
  const { theme } = useTheme();
  const iconColor = color || theme.text;

  return (
    <TouchableOpacity
      style={[
        styles.menuItem,
        { backgroundColor: theme.background === '#FFFFFF' ? '#F5F5F5' : '#1A1D1F' },
      ]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.menuItemLeft}>
        <Ionicons name={icon} size={24} color={iconColor} />
        <ThemedText style={[styles.menuItemLabel, { color: iconColor }]}>{label}</ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 32,
  },
  headerText: {
    fontSize: 32,
    fontFamily: Typography.metropolis.semiBold,
    lineHeight: 40,
  },
  greenText: {
    color: Colors.brandGreen,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 20,
    backgroundColor: '#FFF',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F5F5F5',
  },
  nameContainer: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontFamily: Typography.metropolis.semiBold,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: Typography.metropolis.semiBold,
  },
  savingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 20,
    backgroundColor: '#FFF',
  },
  savingsInfo: {
    flex: 1,
  },
  savingsLabel: {
    fontSize: 14,
    fontFamily: Typography.metropolis.medium,
    marginBottom: 8,
  },
  savingsAmount: {
    fontSize: 32,
    fontFamily: Typography.metropolis.semiBold,
  },
  greenAmount: {
    color: Colors.brandGreen,
  },
  menuContainer: {
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    paddingVertical: 20,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemLabel: {
    fontSize: 18,
    fontFamily: Typography.metropolis.semiBold,
  },
});
