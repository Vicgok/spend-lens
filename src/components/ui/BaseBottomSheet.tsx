/**
 * BaseBottomSheet
 *
 * Visual-only wrapper for drag-animated bottom sheets.
 * Owns: <Modal>, backdrop (with pressable dismiss), KeyboardAvoidingView.
 * Does NOT own: Animated.View, PanResponder, height state, form logic.
 *
 * Also exports `shellStyles` — the canonical style tokens for the sheet
 * container, handle bar, header row, and close button. Callers import
 * shellStyles so their Animated.View and header match the same design
 * system without duplicating magic numbers.
 *
 * Usage:
 *   <BaseBottomSheet visible={visible} onClose={onClose}>
 *     <Animated.View style={[shellStyles.sheet, { height: sheetHeight }]}>
 *       <View {...panResponder.panHandlers} style={shellStyles.handleContainer}>
 *         <View style={shellStyles.handle} />
 *       </View>
 *       ...form content...
 *     </Animated.View>
 *   </BaseBottomSheet>
 */

import React from 'react';
import {
  Modal,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { tokens } from '@/theme';

const { colors, radii, shadow } = tokens;

// ─── Shared visual tokens ──────────────────────────────────────────────────
// Exported so AddFinancialSourceSheet (and any future animated sheet) can
// import and apply these directly to their Animated.View / header / handle,
// giving visual consistency without surrendering gesture or animation control.

export const shellStyles = StyleSheet.create({
  /** Semi-transparent backdrop — flex:1, anchors content to bottom */
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 10, 0.72)',
    justifyContent: 'flex-end',
  },
  /** Sizing wrapper that sits above the keyboard */
  sheetWrap: {
    width: '100%',
  },
  /**
   * The sheet surface itself. Applied to Animated.View in the caller so
   * the dynamic height prop can be merged in: [shellStyles.sheet, {height}]
   */
  sheet: {
    backgroundColor: colors.surface,      // '#FFF8EE' warm paper
    borderTopLeftRadius: 24,               // sheetRadii.card → standardized 24
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 24,                 // sheetSpacing['2xl']
    paddingTop: 4,                         // tight top so handle sits flush
    width: '100%',
    ...shadow.sheet,
  },
  /** Touch target wrapping the drag handle — spread panHandlers here */
  handleContainer: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Visual pill handle */
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  /**
   * Row that holds [title block | mascot slot | close button].
   * position: 'relative' lets mascot decorations use absolute positioning.
   */
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
    marginBottom: 16,
  },
  /** Standardized circular close button — 28×28 */
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Component ────────────────────────────────────────────────────────────

export interface BaseBottomSheetProps {
  /** Controls Modal visibility */
  visible: boolean;
  /** Called on backdrop press and Android hardware back */
  onClose: () => void;
  /**
   * Sheet contents — caller renders its own Animated.View + PanResponder.
   * Apply shellStyles.sheet to the Animated.View.
   */
  children: React.ReactNode;
  testID?: string;
}

/**
 * Renders the Modal + backdrop + KeyboardAvoidingView shell.
 * Everything inside `children` is fully owned by the caller.
 */
export const BaseBottomSheet: React.FC<BaseBottomSheetProps> = ({
  visible,
  onClose,
  children,
  testID,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
      testID={testID}
    >
      <View style={shellStyles.overlay}>
        {/* Backdrop — tapping outside the sheet closes it */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Keyboard-safe wrapper — children float above keyboard on iOS */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={shellStyles.sheetWrap}
        >
          {children}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default BaseBottomSheet;
