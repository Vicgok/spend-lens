import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  FlatList,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAccountDetailRoute } from '@/navigation/routes';
import { typography, spacing, tokens } from '@/theme';
import {
  ACCOUNTS_SCREEN_COLORS,
  ACCOUNTS_SCREEN_COPY,
  CURRENCY_SYMBOL,
} from '@/lib/constants';
import { useManageAccounts } from '@/hooks/use-manage-accounts';
import { StatusBar } from 'expo-status-bar';
import {
  BankLogo,
  ReadingNotebookMascot,
  LeafCluster,
  CurrentAccountsList,
  TabHeader,
  BaseModal,
} from '@/components/ui';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const { height } = Dimensions.get('window');

const ChevronRightIcon = React.memo(({ color }: { color: string }) => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 18l6-6-6-6" />
  </Svg>
));

const BankPresetIcon = React.memo(({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 21h18" />
    <Path d="M3 10h18" />
    <Path d="M5 6l7-3 7 3" />
    <Path d="M4 10v11" />
    <Path d="M20 10v11" />
  </Svg>
));

const CreditCardPresetIcon = React.memo(({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
    <Path d="M2 10h20" />
  </Svg>
));

const WalletPresetIcon = React.memo(({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <Path d="M12 18h.01" />
  </Svg>
));

const ShieldIcon = React.memo(({ color }: { color: string }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Svg>
));

const InfoIcon = React.memo(({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 16v-4" />
    <Path d="M12 8h.01" />
  </Svg>
));

const SearchIcon = React.memo(({ color }: { color: string }) => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="11" cy="11" r="8" />
    <Path d="M21 21l-4.3-4.3" />
  </Svg>
));

const CloseIcon = React.memo(({ color }: { color: string }) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 6L6 18M6 6l12 12" />
  </Svg>
));

const SingleLeaf = React.memo(({ width = 16, height = 16, strokeColor, fillBg }: { width?: number; height?: number; strokeColor: string; fillBg: string }) => (
  <Svg width={width} height={height} viewBox="0 0 20 20" fill="none">
    <Path d="M10 18c-3 0-5-2-5-5 3 0 5 2 5 5z" fill={fillBg} stroke={strokeColor} strokeWidth={1} strokeLinejoin="round" />
    <Path d="M10 18c0-3 2-5 5-5 0 3-2 5-5 5z" fill={fillBg} stroke={strokeColor} strokeWidth={1} strokeLinejoin="round" />
    <Path d="M10 18V10" stroke={strokeColor} strokeWidth={1} strokeLinecap="round" />
  </Svg>
));

export default function ManageAccountsScreen() {
  const insets = useSafeAreaInsets();
  const {
    accounts,
    balanceInput,
    balanceModalVisible,
    filteredBanks,
    genericType,
    handleAddGeneric,
    handleDeleteAccount,
    handleOpenBankPicker,
    handleSaveAccount,
    handleSelectBank,
    isSubmitting,
    modalVisible,
    pickerType,
    searchQuery,
    selectedAccountId,
    selectedBank,
    setBalanceInput,
    setBalanceModalVisible,
    setModalVisible,
    setSearchQuery,
    setSelectedAccountId,
    showDeferredContent,
    showDeferredModals,
  } = useManageAccounts();

  const handlePressActive = useCallback((account: { id: string }) => {
    router.push(getAccountDetailRoute(account.id));
  }, []);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 12 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TabHeader
          microHeader={ACCOUNTS_SCREEN_COPY.userControlPanel}
          title={ACCOUNTS_SCREEN_COPY.manageAccounts}
          variant="tactile"
          subtitle={ACCOUNTS_SCREEN_COPY.manageAccountsSubtitle}
          renderRight={() => (
            <View style={styles.headerRight}>
              <View style={styles.mascotLeafDecor}>
                <LeafCluster />
              </View>
              <ReadingNotebookMascot width={90} height={72} />
            </View>
          )}
        />

        <Text style={styles.sectionTitle}>{ACCOUNTS_SCREEN_COPY.currentAccounts}</Text>
        <View style={styles.currentAccountsSection}>
          {showDeferredContent ? (
            <CurrentAccountsList
              accounts={accounts}
              selectedAccountId={selectedAccountId}
              onSelectAccountId={setSelectedAccountId}
              onDeleteAccount={handleDeleteAccount}
              onPressActive={handlePressActive}
            />
          ) : (
            <View style={styles.deferredAccountsPlaceholder} />
          )}
        </View>

        <Text style={styles.sectionTitle}>{ACCOUNTS_SCREEN_COPY.addNewAccount}</Text>
        <View style={styles.presetsGrid}>
          <View style={styles.presetsRow}>
            <Pressable
              onPress={() => handleOpenBankPicker('bank')}
              style={({ pressed }) => [styles.presetCard, pressed && styles.pressedCard]}
            >
              <View style={styles.presetTop}>
                <View style={styles.presetIconOuter}>
                  <BankPresetIcon color={ACCOUNTS_SCREEN_COLORS.primary} />
                </View>
                <View style={styles.chevronCircle}>
                  <ChevronRightIcon color={ACCOUNTS_SCREEN_COLORS.primary} />
                </View>
              </View>
              <View style={styles.presetTextContainer}>
                <Text style={styles.presetTitle}>{ACCOUNTS_SCREEN_COPY.bankAccount}</Text>
                <Text style={styles.presetDesc}>{ACCOUNTS_SCREEN_COPY.bankAccountDescription}</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => handleAddGeneric('credit_card')}
              disabled={accounts.some((account) => account.type === 'credit_card' && !account.bankId)}
              style={({ pressed }) => [
                styles.presetCard,
                accounts.some((account) => account.type === 'credit_card' && !account.bankId) && styles.disabledCard,
                pressed && styles.pressedCard,
              ]}
            >
              <View style={styles.presetTop}>
                <View style={styles.presetIconOuter}>
                  <CreditCardPresetIcon color={ACCOUNTS_SCREEN_COLORS.primary} />
                </View>
                <View style={styles.chevronCircle}>
                  <ChevronRightIcon color={ACCOUNTS_SCREEN_COLORS.primary} />
                </View>
              </View>
              <View style={styles.presetTextContainer}>
                <Text style={styles.presetTitle}>{ACCOUNTS_SCREEN_COPY.creditCard}</Text>
                <Text style={styles.presetDesc}>{ACCOUNTS_SCREEN_COPY.creditCardDescription}</Text>
              </View>
            </Pressable>
          </View>

          <Pressable
            onPress={() => handleOpenBankPicker('wallet')}
            style={({ pressed }) => [styles.presetCardFull, pressed && styles.pressedCard]}
          >
            <View style={styles.presetFullLeft}>
              <View style={styles.presetIconOuter}>
                <WalletPresetIcon color={ACCOUNTS_SCREEN_COLORS.primary} />
              </View>
              <View style={styles.presetFullText}>
                <Text style={styles.presetTitle}>{ACCOUNTS_SCREEN_COPY.digitalWallet}</Text>
                <Text style={styles.presetDesc}>{ACCOUNTS_SCREEN_COPY.digitalWalletDescription}</Text>
              </View>
            </View>
            <View style={styles.chevronCircle}>
              <ChevronRightIcon color={ACCOUNTS_SCREEN_COLORS.primary} />
            </View>
          </Pressable>
        </View>

        {showDeferredContent ? (
          <View style={styles.privacyCard}>
            <View style={styles.privacyIconOuter}>
              <ShieldIcon color={ACCOUNTS_SCREEN_COLORS.green} />
            </View>
            <View style={styles.privacyContent}>
              <Text style={styles.privacyTitle}>{ACCOUNTS_SCREEN_COPY.privacyTitle}</Text>
              <View style={styles.privacyList}>
                {ACCOUNTS_SCREEN_COPY.privacyPoints.map((point) => (
                  <View key={point} style={styles.privacyItem}>
                    <Text style={styles.privacyCheck}>✓</Text>
                    <Text style={styles.privacyText}>{point}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.leafDecor}>
              <LeafCluster />
            </View>
          </View>
        ) : (
          <View style={styles.deferredCardPlaceholder} />
        )}

        {showDeferredContent ? (
          <View style={styles.noteCard}>
            <View style={styles.noteIconOuter}>
              <InfoIcon color={ACCOUNTS_SCREEN_COLORS.primary} />
            </View>
            <View style={styles.noteContent}>
              <Text style={styles.noteTitle}>{ACCOUNTS_SCREEN_COPY.noteTitle}</Text>
              <Text style={styles.noteText}>{ACCOUNTS_SCREEN_COPY.noteText}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.deferredCardPlaceholder} />
        )}

        <View style={styles.bgLeaf1} pointerEvents="none">
          <SingleLeaf strokeColor={ACCOUNTS_SCREEN_COLORS.green} fillBg={ACCOUNTS_SCREEN_COLORS.lightGreen} />
        </View>
        <View style={styles.bgLeaf2} pointerEvents="none">
          <SingleLeaf strokeColor={ACCOUNTS_SCREEN_COLORS.green} fillBg={ACCOUNTS_SCREEN_COLORS.lightGreen} />
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.bottomDecorLeft} pointerEvents="none">
        <LeafCluster />
      </View>
      <View style={styles.bottomDecorRight} pointerEvents="none">
        <LeafCluster />
      </View>

      {showDeferredModals ? (
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
          statusBarTranslucent
          navigationBarTranslucent
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Select {pickerType === 'bank' ? ACCOUNTS_SCREEN_COPY.bankAccount : ACCOUNTS_SCREEN_COPY.digitalWallet}
                </Text>
                <Pressable onPress={() => setModalVisible(false)} style={styles.modalCloseButton}>
                  <CloseIcon color={ACCOUNTS_SCREEN_COLORS.secondary} />
                </Pressable>
              </View>

              <View style={styles.searchContainer}>
                <SearchIcon color={ACCOUNTS_SCREEN_COLORS.secondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={`Search ${pickerType === 'bank' ? 'banks' : 'wallets'}...`}
                  placeholderTextColor="rgba(116, 81, 67, 0.4)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
              </View>

              {filteredBanks.length === 0 ? (
                <View style={styles.modalEmptyState}>
                  <Text style={styles.modalEmptyText}>
                    No {pickerType === 'bank' ? 'banks' : 'wallets'} found or all already added.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredBanks}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.modalList}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <Pressable style={styles.bankItem} onPress={() => handleSelectBank(item)}>
                      <View style={[styles.bankLogoBg, { backgroundColor: item.color + '15' }]}>
                        <BankLogo bankId={item.id} size={30} />
                      </View>
                      <View style={styles.bankItemInfo}>
                        <Text style={styles.bankItemName}>{item.name}</Text>
                        <Text style={styles.bankItemType}>
                          {item.type === 'bank' ? 'Indian Bank' : 'Digital Wallet'}
                        </Text>
                      </View>
                    </Pressable>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>
      ) : null}

      {showDeferredModals ? (
        <BaseModal
          visible={balanceModalVisible}
          onClose={() => setBalanceModalVisible(false)}
          variant="dialog"
          title={ACCOUNTS_SCREEN_COPY.startingBalance}
          subtitle={
            selectedBank
              ? `for ${selectedBank.name}`
              : `for ${genericType === 'cash' ? 'Cash' : 'Credit Card'}`
          }
          primaryAction={{
            label: isSubmitting ? ACCOUNTS_SCREEN_COPY.saving : ACCOUNTS_SCREEN_COPY.save,
            onPress: handleSaveAccount,
            disabled: isSubmitting,
          }}
          secondaryAction={{
            label: ACCOUNTS_SCREEN_COPY.cancel,
            onPress: () => setBalanceModalVisible(false),
          }}
          avoidKeyboard
        >
          <View style={styles.dialogInputContainer}>
            <Text style={styles.dialogCurrencySymbol}>{CURRENCY_SYMBOL.INR}</Text>
            <TextInput
              style={styles.dialogInput}
              placeholder="0"
              placeholderTextColor="rgba(116, 81, 67, 0.4)"
              keyboardType="decimal-pad"
              value={balanceInput}
              onChangeText={(text) => setBalanceInput(text.replace(/[^0-9.]/g, ''))}
              autoFocus
            />
          </View>
        </BaseModal>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.tactileBackground,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    // Extra bottom padding to clear the floating tab bar (70px height + 24px bottom offset)
    paddingBottom: 120,
  },
  headerRight: {
    position: 'relative',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  mascotLeafDecor: {
    position: 'absolute',
    left: -18,
    top: -12,
    opacity: 0.35,
    transform: [{ rotate: '-12deg' }],
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 13,
    letterSpacing: 1,
    color: ACCOUNTS_SCREEN_COLORS.secondary,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
  currentAccountsSection: {
    marginBottom: 28,
  },
  deferredAccountsPlaceholder: {
    height: 212,
  },
  deferredCardPlaceholder: {
    height: 140,
    marginBottom: 20,
  },
  presetsGrid: {
    gap: 12,
    marginBottom: 20,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  presetCard: {
    flex: 1,
    backgroundColor: ACCOUNTS_SCREEN_COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: ACCOUNTS_SCREEN_COLORS.border,
    padding: 16,
    minHeight: 140,
    justifyContent: 'space-between',
    shadowColor: ACCOUNTS_SCREEN_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  pressedCard: {
    opacity: 0.95,
  },
  disabledCard: {
    opacity: 0.5,
  },
  presetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  presetIconOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ACCOUNTS_SCREEN_COLORS.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ACCOUNTS_SCREEN_COLORS.border,
  },
  chevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ACCOUNTS_SCREEN_COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ACCOUNTS_SCREEN_COLORS.surface,
  },
  presetTextContainer: {
    gap: 2,
  },
  presetTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    color: ACCOUNTS_SCREEN_COLORS.primary,
  },
  presetDesc: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: ACCOUNTS_SCREEN_COLORS.secondary,
    lineHeight: 16,
  },
  presetCardFull: {
    backgroundColor: ACCOUNTS_SCREEN_COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: ACCOUNTS_SCREEN_COLORS.border,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: ACCOUNTS_SCREEN_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  presetFullLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  presetFullText: {
    flex: 1,
    gap: 2,
  },
  privacyCard: {
    backgroundColor: ACCOUNTS_SCREEN_COLORS.lightGreen,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: ACCOUNTS_SCREEN_COLORS.border,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    gap: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: ACCOUNTS_SCREEN_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  privacyIconOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ACCOUNTS_SCREEN_COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ACCOUNTS_SCREEN_COLORS.border,
  },
  privacyContent: {
    flex: 1,
    zIndex: 1,
  },
  privacyTitle: {
    fontSize: 17,
    fontFamily: typography.fontFamily.bold,
    color: ACCOUNTS_SCREEN_COLORS.green,
    marginBottom: 12,
  },
  privacyList: {
    gap: 8,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  privacyCheck: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: ACCOUNTS_SCREEN_COLORS.green,
  },
  privacyText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
    color: ACCOUNTS_SCREEN_COLORS.secondary,
  },
  leafDecor: {
    position: 'absolute',
    right: 0,
    bottom: -10,
  },
  noteCard: {
    backgroundColor: ACCOUNTS_SCREEN_COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: ACCOUNTS_SCREEN_COLORS.border,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    gap: 16,
    shadowColor: ACCOUNTS_SCREEN_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  noteIconOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ACCOUNTS_SCREEN_COLORS.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ACCOUNTS_SCREEN_COLORS.border,
  },
  noteContent: {
    flex: 1,
    gap: 4,
  },
  noteTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    color: ACCOUNTS_SCREEN_COLORS.primary,
  },
  noteText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: ACCOUNTS_SCREEN_COLORS.secondary,
    lineHeight: 18,
  },
  bottomDecorLeft: {
    position: 'absolute',
    left: -10,
    bottom: -10,
    opacity: 0.15,
  },
  bottomDecorRight: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    opacity: 0.15,
    transform: [{ scaleX: -1 }],
  },
  bgLeaf1: {
    position: 'absolute',
    right: 32,
    top: 240,
    opacity: 0.08,
  },
  bgLeaf2: {
    position: 'absolute',
    left: 16,
    top: 480,
    opacity: 0.08,
    transform: [{ rotate: '45deg' }],
  },
  bottomSpacer: {
    height: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 10, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: ACCOUNTS_SCREEN_COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: ACCOUNTS_SCREEN_COLORS.border,
    borderBottomWidth: 0,
    height: height * 0.75,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 17,
    color: ACCOUNTS_SCREEN_COLORS.primary,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ACCOUNTS_SCREEN_COLORS.lightGreen,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: ACCOUNTS_SCREEN_COLORS.border,
    gap: 8,
    backgroundColor: ACCOUNTS_SCREEN_COLORS.surface,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    padding: 0,
    color: ACCOUNTS_SCREEN_COLORS.primary,
  },
  modalList: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: ACCOUNTS_SCREEN_COLORS.border,
    gap: 16,
  },
  bankLogoBg: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankItemInfo: {
    flex: 1,
  },
  bankItemName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 15,
    color: ACCOUNTS_SCREEN_COLORS.primary,
  },
  bankItemType: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    color: ACCOUNTS_SCREEN_COLORS.secondary,
    marginTop: 2,
  },
  modalEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalEmptyText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
    color: ACCOUNTS_SCREEN_COLORS.secondary,
    textAlign: 'center',
  },
  dialogInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1,
    borderColor: ACCOUNTS_SCREEN_COLORS.border,
    marginBottom: 4,
    width: '100%',
    backgroundColor: ACCOUNTS_SCREEN_COLORS.surface,
  },
  dialogCurrencySymbol: {
    fontFamily: typography.fontFamily.monoBold,
    fontSize: 22,
    marginRight: 8,
    color: ACCOUNTS_SCREEN_COLORS.primary,
  },
  dialogInput: {
    flex: 1,
    fontFamily: typography.fontFamily.monoBold,
    fontSize: 22,
    padding: 0,
    color: ACCOUNTS_SCREEN_COLORS.primary,
  },
});
