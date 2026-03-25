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
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import i18n, { setStoredLanguage } from '../../src/localization/i18n';

export default function ProfileScreen() {
  const router = useRouter();
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
      if (docSnap && docSnap.exists()) {
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerText}>
            {t('manage_your')}{' '}
            <Text style={styles.greenText}>{t('profile')}</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={styles.topPill}
          activeOpacity={0.7}
          onPress={() => router.push('/profile-details')}
        >
          <View style={styles.profileTopRow}>
            <View style={styles.avatarContainer}>
              {userData?.photoURL || getAuth().currentUser?.photoURL ? (
                <Image
                  source={{ uri: userData?.photoURL || getAuth().currentUser?.photoURL || undefined }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Ionicons name="person" size={32} color="#CCC" />
                </View>
              )}
            </View>

            <View style={styles.nameContainer}>
              <Text style={styles.userName}>
                {userData ? `${userData.firstName ?? ''} ${userData.lastName ?? ''}`.trim() : t('loading')}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('savings_tracker')}</Text>
        </View>

        <View style={styles.savingsCard}>
          <View style={styles.savingsInfo}>
            <Text style={styles.savingsLabel}>{t('cashback_balance')}</Text>
            <Text style={styles.savingsAmount}>
              <Text style={styles.greenAmount}>{userData?.cashback ?? 0}</Text> QAR
            </Text>
          </View>
        </View>

        {userData?.role === 'creator' && userData?.creatorCode && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('creator_code')}</Text>
            </View>

            <View style={styles.savingsCard}>
              <View style={styles.savingsInfo}>
                <Text style={styles.savingsLabel}>{t('your_creator_code')}</Text>
                <Text style={styles.savingsAmount}>
                  <Text style={styles.greenAmount}>{userData.creatorCode}</Text>
                </Text>
              </View>
            </View>
          </>
        )}

        <View style={styles.menuContainer}>
          <MenuItem
            icon="time-outline"
            label={t('redemption_history')}
            onPress={() => router.push('/redemption-history' as any)}
          />
          <MenuItem
            icon="language-outline"
            label={t('change_language')}
            onPress={openLanguageMenu}
          />
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

          <TouchableOpacity
            style={styles.logoutPill}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.logoutContent}>
              <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
              <Text style={styles.logoutText}>{t('log_out')}</Text>
            </View>
          </TouchableOpacity>
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
  return (
    <TouchableOpacity
      style={styles.menuItem}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.menuItemLeft}>
        <Ionicons name={icon} size={24} color={color || '#000'} />
        <Text style={[styles.menuItemLabel, { color: color || Colors.light.text }]}>
          {label}
        </Text>
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
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 16,
  },
  headerText: {
    fontSize: 28,
    fontFamily: Typography.poppins.semiBold,
    color: Colors.light.text,
    letterSpacing: 0.5,
  },
  greenText: {
    color: '#1AD04F',
    fontFamily: Typography.poppins.semiBold,
  },
  topPill: {
    backgroundColor: '#F5F5F7',
    borderRadius: 30,
    padding: 16,
    marginBottom: 24,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    marginRight: 16,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  nameContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 20,
    fontFamily: Typography.poppins.semiBold,
    color: Colors.light.text,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Typography.poppins.semiBold,
    color: Colors.light.text,
  },
  savingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F0F0F2',
  },
  savingsInfo: {
    gap: 8,
  },
  savingsLabel: {
    fontSize: 14,
    fontFamily: Typography.poppins.medium,
    color: '#666',
  },
  savingsAmount: {
    fontSize: 32,
    fontFamily: Typography.poppins.semiBold,
    color: '#000',
  },
  greenAmount: {
    color: '#1AD04F',
  },
  menuContainer: {
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#F5F5F7',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemLabel: {
    fontSize: 16,
    fontFamily: Typography.poppins.semiBold,
  },
  logoutPill: {
    backgroundColor: '#FFF1F0',
    borderRadius: 30,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD5D2',
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontFamily: Typography.poppins.semiBold,
    color: '#FF3B30',
  },
});