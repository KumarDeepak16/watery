// Bottom sheet. Tap backdrop to close. Drag handle down to dismiss. No bounce.

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';
import { Text } from './Text';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_MAX = SCREEN_H * 0.82;
const DISMISS_THRESHOLD = 90;  // px down to trigger dismiss
const DISMISS_VELOCITY = 0.5;  // px/ms

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
}

export function Sheet({ visible, onClose, title, children }: SheetProps): JSX.Element {
  const { theme, isDark } = useTheme();
  const translateY = useSharedValue(SCREEN_H);
  const backdropOpacity = useSharedValue(0);
  const closingRef = useRef(false);

  // ── open / close driven by `visible` ──────────────────────────────────────
  useEffect(() => {
    if (visible) {
      closingRef.current = false;
      translateY.value = SCREEN_H;
      translateY.value = withSpring(0, { damping: 38, stiffness: 340, mass: 1 });
      backdropOpacity.value = withTiming(1, { duration: 220 });
    } else {
      translateY.value = withTiming(SCREEN_H, { duration: 260, easing: Easing.in(Easing.cubic) });
      backdropOpacity.value = withTiming(0, { duration: 220 });
    }
  }, [visible, translateY, backdropOpacity]);

  // ── programmatic close with animation ─────────────────────────────────────
  const animClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    translateY.value = withTiming(SCREEN_H, { duration: 280, easing: Easing.in(Easing.cubic) });
    backdropOpacity.value = withTiming(0, { duration: 220 });
    setTimeout(onClose, 290);
  }, [translateY, backdropOpacity, onClose]);

  // ── PanResponder on handle bar ─────────────────────────────────────────────
  // Using RN PanResponder (not gesture-handler) to avoid conflicts with
  // gesture-handler ScrollView inside the sheet.
  const dragStart = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 4,
      onPanResponderGrant: (_, gs) => {
        dragStart.current = gs.y0;
      },
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) {
          translateY.value = gs.dy;
        }
      },
      onPanResponderRelease: (_, gs) => {
        const elapsed = gs.moveX === gs.x0 ? 1 : Math.abs((gs.dx || 1));
        const velocity = gs.vy; // px/ms
        if (gs.dy > DISMISS_THRESHOLD || velocity > DISMISS_VELOCITY) {
          // dismiss
          translateY.value = withTiming(SCREEN_H, { duration: 260, easing: Easing.in(Easing.cubic) });
          backdropOpacity.value = withTiming(0, { duration: 220 });
          if (!closingRef.current) {
            closingRef.current = true;
            setTimeout(onClose, 270);
          }
        } else {
          // snap back
          translateY.value = withSpring(0, { damping: 42, stiffness: 400, mass: 0.9 });
        }
      },
    }),
  ).current;

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value * 0.58,
  }));

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={animClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
        {/* ── Backdrop ── tap anywhere on it to close ────────────────────── */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: '#000',
            },
            backdropStyle,
          ]}
        />
        {/* Pressable sits on top of the dim layer but below the sheet */}
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={animClose}
        />

        {/* ── Sheet panel ─────────────────────────────────────────────────── */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'flex-end' }}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              {
                backgroundColor: theme.colors.surface,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                maxHeight: SHEET_MAX,
                borderTopWidth: 1,
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderColor: theme.colors.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -6 },
                shadowOpacity: isDark ? 0.5 : 0.14,
                shadowRadius: 24,
                elevation: 24,
                overflow: 'hidden',
              },
              sheetStyle,
            ]}
          >
            {/* ── Drag handle — PanResponder attached here ────────────── */}
            <View
              {...panResponder.panHandlers}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: 14,
                paddingBottom: 8,
                // extra hit area
                paddingHorizontal: 80,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: theme.colors.textSubtle,
                  opacity: 0.45,
                }}
              />
            </View>

            {/* Title */}
            {title ? (
              <View
                style={{
                  paddingHorizontal: 24,
                  paddingBottom: 14,
                  borderBottomWidth: 1,
                  borderColor: theme.colors.divider,
                }}
              >
                <Text variant="h3" weight="semibold">{title}</Text>
              </View>
            ) : null}

            {/* Content */}
            <ScrollView
              contentContainerStyle={{ padding: 20, paddingBottom: 36 }}
              showsVerticalScrollIndicator={false}
              bounces={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
