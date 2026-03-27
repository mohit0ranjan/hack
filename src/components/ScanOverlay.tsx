import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { colors } from '../theme/colors';

const SCAN_AREA_SIZE = 260;
const CORNER_SIZE = 28;
const CORNER_THICKNESS = 4;

const Corner = ({ style }: { style: object }) => (
  <View style={[styles.corner, style]} />
);

export const ScanOverlay = () => {
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scanLineAnim]);

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_AREA_SIZE - 4],
  });

  return (
    <View pointerEvents="none" style={styles.overlayContainer}>
      <View style={styles.topShade} />

      <View style={styles.middleRow}>
        <View style={styles.sideShade} />

        <View style={styles.scanFrame}>
          {/* Corner brackets */}
          <Corner style={styles.topLeft} />
          <Corner style={styles.topRight} />
          <Corner style={styles.bottomLeft} />
          <Corner style={styles.bottomRight} />

          {/* Animated scan line */}
          <Animated.View
            style={[
              styles.scanLine,
              { transform: [{ translateY }] },
            ]}
          />
        </View>

        <View style={styles.sideShade} />
      </View>

      <View style={styles.bottomShade} />
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  topShade: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 26, 0.55)',
  },
  middleRow: {
    height: SCAN_AREA_SIZE,
    flexDirection: 'row',
  },
  sideShade: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 26, 0.55)',
  },
  scanFrame: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    backgroundColor: 'transparent',
  },
  bottomShade: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 26, 0.55)',
  },

  // Corner bracket styles
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: colors.primary,
    borderTopLeftRadius: 10,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: colors.primary,
    borderTopRightRadius: 10,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: colors.primary,
    borderBottomLeftRadius: 10,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: colors.primary,
    borderBottomRightRadius: 10,
  },

  // Animated scan line
  scanLine: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 2,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 3,
  },
});
