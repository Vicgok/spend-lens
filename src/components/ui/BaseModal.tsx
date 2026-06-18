/**
 * BaseModal
 *
 * Shared shell for center dialogs and simple (non-animated) bottom sheets.
 * Standardizes: backdrop, radius, padding, header layout, title/subtitle
 * typography, close button, and primary/secondary action buttons.
 *
 * Two variants:
 *   'dialog' — centered card, fade animation, full border-radius.
 *   'sheet'  — bottom-anchored, slide animation, top-radius only + handle bar.
 *              Use for sheets that do NOT need custom drag/animation.
 *              For drag-animated sheets, use BaseBottomSheet instead.
 *
 * Usage (dialog with action buttons):
 *   <BaseModal
 *     visible={visible}
 *     onClose={onClose}
 *     variant="dialog"
 *     title="Starting Balance"
 *     subtitle="for HDFC Bank"
 *     primaryAction={{ label: 'Save', onPress: handleSave }}
 *     secondaryAction={{ label: 'Cancel', onPress: onClose }}
 *     avoidKeyboard
 *   >
 *     <TextInput ... />
 *   </BaseModal>
 *
 * Usage (dialog, content only):
 *   <BaseModal visible={visible} onClose={onClose} variant="dialog" title="Select Month">
 *     <ScrollView>...</ScrollView>
 *   </BaseModal>
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { tokens } from '@/theme';

const { colors, radii, shadow } = tokens;

const BACKDROP = 'rgba(15, 12, 10, 0.72)';
const SHEET_RADIUS = 24;
const DIALOG_PADDING = 24;
const ACTION_HEIGHT = 50;
const ACTION_RADIUS = 16;

// ─── Close icon ───────────────────────────────────────────────────────────

const CloseIcon = ({ size = 14, color = colors.textPrimary }: { size?: number; color?: string }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M18 6L6 18M6 6l12 12" />
  </Svg>
);

// ─── Types ────────────────────────────────────────────────────────────────

export interface BaseModalAction {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
  /** 'dialog' = center card | 'sheet' = bottom-anchored (no drag) */
  variant: 'sheet' | 'dialog';
  title?: string;
  subtitle?: string;
  /** Handle bar. Defaults true for sheet, false for dialog. */
  showHandle?: boolean;
  /** Filled primary action button (right / bottom) */
  primaryAction?: BaseModalAction;
  /** Ghost secondary action button (left / top) */
  secondaryAction?: BaseModalAction;
  children?: React.ReactNode;
  /** Wraps content in KeyboardAvoidingView. Useful for input dialogs. */
  avoidKeyboard?: boolean;
  testID?: string;
}

// ─── Component ────────────────────────────────────────────────────────────

export const BaseModal: React.FC<BaseModalProps> = ({
  visible,
  onClose,
  variant,
  title,
  subtitle,
  showHandle,
  primaryAction,
  secondaryAction,
  children,
  avoidKeyboard = false,
  testID,
}) => {
  const isSheet = variant === 'sheet';
  const shouldShowHandle = showHandle ?? isSheet;
  const hasActions = Boolean(primaryAction || secondaryAction);
  const hasHeader = Boolean(title || subtitle);

  // ── Inner card / sheet surface ─────────────────────────────────────────
  const inner = (
    <View style={isSheet ? styles.sheetContainer : styles.dialogCard}>
      {/* Handle bar (sheets only) */}
      {shouldShowHandle && (
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>
      )}

      {/* Header: title + subtitle + close button */}
      {hasHeader && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <CloseIcon />
          </Pressable>
        </View>
      )}

      {/* Custom content */}
      {children}

      {/* Primary / secondary action buttons */}
      {hasActions && (
        <View style={styles.actions}>
          {secondaryAction && (
            <Pressable
              onPress={secondaryAction.onPress}
              style={styles.btnSecondary}
              accessibilityRole="button"
            >
              <Text style={styles.btnSecondaryText}>{secondaryAction.label}</Text>
            </Pressable>
          )}
          {primaryAction && (
            <Pressable
              onPress={primaryAction.onPress}
              disabled={primaryAction.disabled}
              style={[styles.btnPrimary, primaryAction.disabled && styles.btnDisabled]}
              accessibilityRole="button"
            >
              <Text style={styles.btnPrimaryText}>{primaryAction.label}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );

  // ── Keyboard-safe container ────────────────────────────────────────────
  const containerStyle = isSheet ? styles.sheetWrap : styles.dialogWrap;

  const wrappedContent = avoidKeyboard ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={containerStyle}
    >
      {inner}
    </KeyboardAvoidingView>
  ) : (
    <View style={containerStyle}>{inner}</View>
  );

  // ── Modal shell ───────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      transparent
      animationType={isSheet ? 'slide' : 'fade'}
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
      testID={testID}
    >
      <View style={isSheet ? styles.overlaySheet : styles.overlayDialog}>
        {/* Backdrop — tap to dismiss */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        {wrappedContent}
      </View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Backdrops
  overlaySheet: {
    flex: 1,
    backgroundColor: BACKDROP,
    justifyContent: 'flex-end',
  },
  overlayDialog: {
    flex: 1,
    backgroundColor: BACKDROP,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DIALOG_PADDING,
  },

  // Container wrappers
  sheetWrap: {
    width: '100%',
  },
  dialogWrap: {
    width: '100%',
  },

  // Sheet surface (bottom-anchored, top-radius only)
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: DIALOG_PADDING,
    paddingTop: 4,
    width: '100%',
    ...shadow.sheet,
  },

  // Dialog card (centered, full radius)
  dialogCard: {
    backgroundColor: colors.surface,
    borderRadius: SHEET_RADIUS,
    borderWidth: 1,
    borderColor: colors.border,
    padding: DIALOG_PADDING,
    width: '100%',
    ...shadow.sheet,
  },

  // Handle bar
  handleContainer: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },

  // Header row
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 17,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  subtitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },

  // Close button — 28×28 circle
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Action buttons row
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  btnPrimary: {
    flex: 1,
    height: ACTION_HEIGHT,
    borderRadius: ACTION_RADIUS,
    backgroundColor: colors.forest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: colors.surface,
  },
  btnSecondary: {
    flex: 1,
    height: ACTION_HEIGHT,
    borderRadius: ACTION_RADIUS,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});

export default BaseModal;
