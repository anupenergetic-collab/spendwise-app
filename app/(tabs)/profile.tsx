import React, { useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, Pressable, Alert, ScrollView,
  ActivityIndicator, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { useAuth } from '@/lib/auth-context';
import { useSubscription } from '@/lib/subscription-context';
import { useExpenses } from '@/lib/expense-context';

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

interface BackupFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
}

function formatBackupName(name: string): string {
  const match = name.match(/spendwise_backup_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})/);
  if (!match) return name;
  const [, year, month, day, hour, min] = match;
  const date = new Date(`${year}-${month}-${day}T${hour}:${min}:00`);
  return date.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatBytes(bytes?: string): string {
  if (!bytes) return '';
  const n = parseInt(bytes, 10);
  if (isNaN(n)) return '';
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(1)} KB`;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { trialDaysLeft, isTrialActive, isSubscribed, subscription } = useSubscription();
  const { expenses, incomes, restoreAll } = useExpenses();

  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [showBackups, setShowBackups] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : 0;

  const handleBackup = useCallback(async () => {
    setIsBackingUp(true);
    try {
      const resp = await fetch(`${API_BASE}/api/backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expenses, incomes }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Backup failed');
      Alert.alert('Backup Complete', `Your data has been saved to Google Drive.\n\nFile: ${data.file?.name}`);
      if (showBackups) loadBackups();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Backup failed';
      Alert.alert('Backup Failed', message);
    } finally {
      setIsBackingUp(false);
    }
  }, [expenses, incomes, showBackups]);

  const loadBackups = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const resp = await fetch(`${API_BASE}/api/backup/list`);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to load backups');
      setBackups(data.files || []);
      setShowBackups(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load backups';
      Alert.alert('Error', message);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const handleRestore = useCallback(async (fileId: string, fileName: string) => {
    Alert.alert(
      'Restore Backup',
      `This will replace ALL your current data with the backup from "${formatBackupName(fileName)}". This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setRestoringId(fileId);
            try {
              const resp = await fetch(`${API_BASE}/api/backup/${fileId}`);
              const data = await resp.json();
              if (!resp.ok) throw new Error(data.error || 'Failed to fetch backup');
              if (!data.expenses || !data.incomes) throw new Error('Backup file is corrupted');
              await restoreAll(data.expenses, data.incomes);
              Alert.alert('Restore Complete', `Restored ${data.expenses.length} expenses and ${data.incomes.length} income entries.`);
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : 'Restore failed';
              Alert.alert('Restore Failed', message);
            } finally {
              setRestoringId(null);
            }
          },
        },
      ]
    );
  }, [restoreAll]);

  const handleDelete = useCallback(async (fileId: string, fileName: string) => {
    Alert.alert(
      'Delete Backup',
      `Delete backup "${formatBackupName(fileName)}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(fileId);
            try {
              const resp = await fetch(`${API_BASE}/api/backup/${fileId}`, { method: 'DELETE' });
              const data = await resp.json();
              if (!resp.ok) throw new Error(data.error || 'Delete failed');
              setBackups(prev => prev.filter(b => b.id !== fileId));
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : 'Delete failed';
              Alert.alert('Error', message);
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  }, []);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth');
        },
      },
    ]);
  }, [signOut]);

  const avatarLetter = user?.name?.[0]?.toUpperCase() ?? '?';
  const totalTransactions = expenses.length + incomes.length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: botPad + 120 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Profile</Text>

      <View style={styles.card}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.providerBadge}>
              <Ionicons
                name={user?.provider === 'google' ? 'logo-google' : 'mail-outline'}
                size={11}
                color={Colors.light.textMuted}
              />
              <Text style={styles.providerText}>
                {user?.provider === 'google' ? 'Google account' : 'Email account'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{expenses.length}</Text>
            <Text style={styles.statLabel}>Expenses</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{incomes.length}</Text>
            <Text style={styles.statLabel}>Incomes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalTransactions}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.subRow}>
          <View style={[styles.subIcon, isSubscribed ? styles.subIconActive : styles.subIconTrial]}>
            <Ionicons
              name={isSubscribed ? 'shield-checkmark' : 'time-outline'}
              size={18}
              color={isSubscribed ? Colors.light.tint : Colors.light.accent}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.subTitle}>
              {isSubscribed ? `${subscription?.plan === 'monthly' ? 'Monthly' : 'Annual'} Plan` : 'Free Trial'}
            </Text>
            <Text style={styles.subDesc}>
              {isSubscribed
                ? subscription?.expiresAt
                  ? `Renews ${new Date(subscription.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : 'Active subscription'
                : isTrialActive
                ? `${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} remaining`
                : 'Trial expired'}
            </Text>
          </View>
          {!isSubscribed && (
            <Pressable style={styles.upgradeBtn} onPress={() => router.push('/subscription')}>
              <Text style={styles.upgradeBtnText}>Upgrade</Text>
            </Pressable>
          )}
        </View>
      </View>

      <Text style={styles.sectionLabel}>Google Drive Backup</Text>

      <View style={styles.card}>
        <Pressable
          style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
          onPress={handleBackup}
          disabled={isBackingUp}
        >
          <View style={[styles.actionIcon, { backgroundColor: Colors.light.blueLight }]}>
            {isBackingUp
              ? <ActivityIndicator size="small" color={Colors.light.blue} />
              : <Ionicons name="cloud-upload-outline" size={20} color={Colors.light.blue} />
            }
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Backup Now</Text>
            <Text style={styles.actionDesc}>
              {isBackingUp ? 'Uploading to Google Drive…' : `Save ${totalTransactions} transactions to Drive`}
            </Text>
          </View>
          {!isBackingUp && <Feather name="chevron-right" size={16} color={Colors.light.textMuted} />}
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
          onPress={showBackups ? () => setShowBackups(false) : loadBackups}
          disabled={isLoadingList}
        >
          <View style={[styles.actionIcon, { backgroundColor: Colors.light.tintLight }]}>
            {isLoadingList
              ? <ActivityIndicator size="small" color={Colors.light.tint} />
              : <Ionicons name="cloud-download-outline" size={20} color={Colors.light.tint} />
            }
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Restore from Backup</Text>
            <Text style={styles.actionDesc}>
              {isLoadingList ? 'Loading backups…' : showBackups ? 'Hide backup list' : 'Browse your saved backups'}
            </Text>
          </View>
          {!isLoadingList && (
            <Feather
              name={showBackups ? 'chevron-up' : 'chevron-right'}
              size={16}
              color={Colors.light.textMuted}
            />
          )}
        </Pressable>
      </View>

      {showBackups && (
        <View style={styles.card}>
          {backups.length === 0 ? (
            <View style={styles.emptyBackups}>
              <Ionicons name="cloud-outline" size={32} color={Colors.light.gray300} />
              <Text style={styles.emptyBackupsText}>No backups found</Text>
              <Text style={styles.emptyBackupsDesc}>Tap "Backup Now" to create your first backup.</Text>
            </View>
          ) : (
            backups.map((backup, idx) => (
              <View key={backup.id}>
                {idx > 0 && <View style={styles.divider} />}
                <View style={styles.backupRow}>
                  <View style={styles.backupIconWrap}>
                    <Ionicons name="document-text-outline" size={18} color={Colors.light.blue} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.backupName}>{formatBackupName(backup.name)}</Text>
                    {backup.size && (
                      <Text style={styles.backupMeta}>{formatBytes(backup.size)}</Text>
                    )}
                  </View>
                  <Pressable
                    style={({ pressed }) => [styles.backupAction, pressed && styles.pressed]}
                    onPress={() => handleRestore(backup.id, backup.name)}
                    disabled={restoringId === backup.id || deletingId === backup.id}
                  >
                    {restoringId === backup.id
                      ? <ActivityIndicator size="small" color={Colors.light.tint} />
                      : <Ionicons name="refresh-outline" size={18} color={Colors.light.tint} />
                    }
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.backupAction, pressed && styles.pressed]}
                    onPress={() => handleDelete(backup.id, backup.name)}
                    disabled={restoringId === backup.id || deletingId === backup.id}
                  >
                    {deletingId === backup.id
                      ? <ActivityIndicator size="small" color={Colors.light.danger} />
                      : <Ionicons name="trash-outline" size={18} color={Colors.light.danger} />
                    }
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      <Text style={styles.sectionLabel}>Account</Text>

      <View style={styles.card}>
        <Pressable
          style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
          onPress={handleSignOut}
        >
          <View style={[styles.actionIcon, { backgroundColor: Colors.light.dangerLight }]}>
            <Feather name="log-out" size={18} color={Colors.light.danger} />
          </View>
          <Text style={[styles.actionTitle, { color: Colors.light.danger }]}>Sign Out</Text>
          <Feather name="chevron-right" size={16} color={Colors.light.textMuted} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingHorizontal: 16, gap: 12 },
  pageTitle: {
    fontSize: 28, fontFamily: 'DMSans_700Bold',
    color: Colors.light.text, marginBottom: 4,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.light.tint,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontFamily: 'DMSans_700Bold', color: '#fff' },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontSize: 17, fontFamily: 'DMSans_600SemiBold', color: Colors.light.text },
  userEmail: { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.light.textSecondary },
  providerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  providerText: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.light.textMuted },
  divider: { height: 1, backgroundColor: Colors.light.border, marginHorizontal: 16 },
  statsRow: { flexDirection: 'row', paddingVertical: 14 },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.light.border },
  statValue: { fontSize: 20, fontFamily: 'DMSans_700Bold', color: Colors.light.text },
  statLabel: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.light.textMuted, marginTop: 2 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  subIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  subIconActive: { backgroundColor: Colors.light.tintLight },
  subIconTrial: { backgroundColor: Colors.light.accentLight },
  subTitle: { fontSize: 15, fontFamily: 'DMSans_600SemiBold', color: Colors.light.text },
  subDesc: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.light.textSecondary, marginTop: 1 },
  upgradeBtn: {
    backgroundColor: Colors.light.tint, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  upgradeBtnText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: '#fff' },
  sectionLabel: {
    fontSize: 13, fontFamily: 'DMSans_500Medium',
    color: Colors.light.textMuted, textTransform: 'uppercase',
    letterSpacing: 0.8, marginTop: 4, marginLeft: 4,
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  actionIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontSize: 15, fontFamily: 'DMSans_500Medium', color: Colors.light.text, flex: 1 },
  actionDesc: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.light.textSecondary, marginTop: 1 },
  pressed: { opacity: 0.6 },
  emptyBackups: { alignItems: 'center', paddingVertical: 28, gap: 6 },
  emptyBackupsText: { fontSize: 15, fontFamily: 'DMSans_500Medium', color: Colors.light.textSecondary },
  emptyBackupsDesc: { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.light.textMuted, textAlign: 'center', paddingHorizontal: 24 },
  backupRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 16 },
  backupIconWrap: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: Colors.light.blueLight,
    alignItems: 'center', justifyContent: 'center',
  },
  backupName: { fontSize: 14, fontFamily: 'DMSans_500Medium', color: Colors.light.text },
  backupMeta: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.light.textMuted, marginTop: 1 },
  backupAction: { padding: 6 },
});
