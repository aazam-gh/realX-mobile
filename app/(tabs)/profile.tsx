import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../constants/Typography';

export default function ProfileScreen() {
  const router = useRouter();
  const PURPLE = '#7D57FF';

  const handleEditPress = () => {
    router.push('/edit-profile');
  };

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            try {
              await auth().signOut();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>
            Manage your <Text style={styles.purpleText}>profile</Text>
          </Text>
        </View>

        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <Image
              source={{ uri: 'https://i.pravatar.cc/150?u=ahmed' }} // Placeholder for user avatar
              style={styles.avatar}
            />
            <View style={styles.nameContainer}>
              <Text style={styles.userName}>Ahmed Almalki</Text>
              <Text style={styles.userPhone}>+974 5566 7788</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            activeOpacity={0.7}
            onPress={handleEditPress}
          >
            <Text style={styles.editButtonText}>Edit</Text>
            <Ionicons name="chevron-forward" size={14} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Verification Alert */}
        <View style={styles.verificationBanner}>
          <View style={styles.infoIconContainer}>
            <View style={styles.infoCircle}>
              <Ionicons name="information-outline" size={24} color="#000" />
            </View>
          </View>
          <View style={styles.verificationTextContainer}>
            <Text style={styles.verificationTitle}>Verification pending</Text>
            <Text style={styles.verificationSubtitle}>
              Your account is still awaiting verification.
            </Text>
          </View>
        </View>

        {/* Savings Tracker Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Savings Tracker</Text>
        </View>

        <View style={styles.savingsCard}>
          <View style={styles.savingsInfo}>
            <Text style={styles.savingsLabel}>All time you've saved</Text>
            <Text style={styles.savingsAmount}>
              <Text style={styles.purpleAmount}>20</Text> QAR
            </Text>
          </View>
          <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
            <Text style={styles.moreButtonText}>More</Text>
            <Ionicons name="chevron-forward" size={14} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <MenuItem icon="time-outline" label="Redemption History" />
          <MenuItem icon="heart-outline" label="Favourites" />
          <MenuItem icon="language-outline" label="Change Language" />
          <MenuItem icon="logo-whatsapp" label="Contact Us" />
          <MenuItem
            icon="document-text-outline"
            label="Terms and Conditions"
            onPress={() => router.push('/terms')}
          />
          <MenuItem
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => router.push('/privacy')}
          />
          <MenuItem
            icon="log-out-outline"
            label="Log out"
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
  color = '#000'
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
        <Ionicons name={icon} size={24} color={color} />
        <Text style={[styles.menuItemLabel, { color }]}>{label}</Text>
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
    color: '#000',
    lineHeight: 40,
  },
  purpleText: {
    color: '#7D57FF',
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
    color: '#000',
  },
  userPhone: {
    fontSize: 14,
    fontFamily: Typography.metropolis.medium,
    color: '#999',
    marginTop: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  editButtonText: {
    fontSize: 14,
    fontFamily: Typography.metropolis.medium,
    color: '#000',
    marginRight: 4,
  },
  verificationBanner: {
    flexDirection: 'row',
    padding: 24,
    borderRadius: 32,
    backgroundColor: '#F5F5F5',
    marginBottom: 32,
    alignItems: 'center',
  },
  infoIconContainer: {
    marginRight: 16,
  },
  infoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationTextContainer: {
    flex: 1,
  },
  verificationTitle: {
    fontSize: 18,
    fontFamily: Typography.metropolis.semiBold,
    color: '#000',
  },
  verificationSubtitle: {
    fontSize: 14,
    fontFamily: Typography.metropolis.medium,
    color: '#000',
    marginTop: 6,
    lineHeight: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: Typography.metropolis.semiBold,
    color: '#000',
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
    color: '#999',
    marginBottom: 8,
  },
  savingsAmount: {
    fontSize: 32,
    fontFamily: Typography.metropolis.semiBold,
    color: '#000',
  },
  purpleAmount: {
    color: '#7D57FF',
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: '#F9F9F9',
  },
  moreButtonText: {
    fontSize: 14,
    fontFamily: Typography.metropolis.medium,
    color: '#000',
    marginRight: 4,
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
    color: '#000',
  },
});
