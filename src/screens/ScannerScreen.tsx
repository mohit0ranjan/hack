import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ScanOverlay } from '../components/ScanOverlay';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types';

type ScannerNavigation = NativeStackNavigationProp<RootStackParamList, 'Scanner'>;

const CAMERA_TIMEOUT_MS = 8000;

export const ScannerScreen = () => {
  const navigation = useNavigation<ScannerNavigation>();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraTimedOut, setCameraTimedOut] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);

  const lastScannedValue = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  // Pulse animation for the loading indicator
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // Camera timeout: if camera doesn't become ready in N seconds, show fallback
  useEffect(() => {
    if (permission?.granted && !cameraReady && !cameraTimedOut) {
      timeoutRef.current = setTimeout(() => {
        setCameraTimedOut(true);
        setShowManualEntry(true);
      }, CAMERA_TIMEOUT_MS);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [permission?.granted, cameraReady, cameraTimedOut]);

  // Reset scan lock when returning to this screen
  useEffect(() => {
    if (isFocused) {
      setScanLocked(false);
      lastScannedValue.current = null;
    }
  }, [isFocused]);

  const handleBarcodeScan = useCallback(
    async (result: BarcodeScanningResult) => {
      if (scanLocked) return;

      const rawValue = result.data?.trim();
      if (!rawValue || rawValue === lastScannedValue.current) return;

      lastScannedValue.current = rawValue;
      setScanLocked(true);

      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Haptics can fail on unsupported devices
      }

      navigation.navigate('Result', { barcode: rawValue });
    },
    [navigation, scanLocked],
  );

  const handleManualSubmit = useCallback(() => {
    const barcode = manualBarcode.trim();
    if (!barcode) return;
    Keyboard.dismiss();
    navigation.navigate('Result', { barcode });
  }, [manualBarcode, navigation]);

  const handleRetryCamera = useCallback(() => {
    setCameraTimedOut(false);
    setCameraReady(false);
    setShowManualEntry(false);
  }, []);

  // ─── Permission not yet determined ───
  if (!permission) {
    return (
      <View style={styles.centered}>
        <Animated.View style={{ opacity: pulseAnim }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </Animated.View>
        <Text style={styles.helperText}>Loading camera...</Text>
      </View>
    );
  }

  // ─── Permission denied ───
  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <View style={styles.permissionIcon}>
          <Text style={styles.permissionEmoji}>📷</Text>
        </View>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          EcoScan AI needs camera permission to scan product barcodes and analyze their environmental impact.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission} activeOpacity={0.8}>
          <Text style={styles.primaryButtonText}>Allow Camera Access</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setShowManualEntry(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>Enter Barcode Manually</Text>
        </TouchableOpacity>

        {showManualEntry && (
          <View style={styles.manualEntryBox}>
            <TextInput
              style={styles.manualInput}
              placeholder="e.g. 3017620422003"
              placeholderTextColor="#9CA3AF"
              value={manualBarcode}
              onChangeText={setManualBarcode}
              keyboardType="default"
              autoCapitalize="none"
              returnKeyType="go"
              onSubmitEditing={handleManualSubmit}
            />
            <TouchableOpacity
              style={[styles.lookUpButton, !manualBarcode.trim() && styles.lookUpButtonDisabled]}
              onPress={handleManualSubmit}
              disabled={!manualBarcode.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.lookUpButtonText}>Look Up</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // ─── Camera timed out ───
  if (cameraTimedOut) {
    return (
      <View style={styles.centered}>
        <View style={styles.permissionIcon}>
          <Text style={styles.permissionEmoji}>⏱️</Text>
        </View>
        <Text style={styles.permissionTitle}>Camera Unavailable</Text>
        <Text style={styles.permissionText}>
          The camera couldn't be initialized. You can retry or enter a barcode manually.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={handleRetryCamera} activeOpacity={0.8}>
          <Text style={styles.primaryButtonText}>Retry Camera</Text>
        </TouchableOpacity>

        <View style={styles.manualEntryBox}>
          <Text style={styles.manualEntryLabel}>Or enter a barcode:</Text>
          <TextInput
            style={styles.manualInput}
            placeholder="e.g. 3017620422003"
            placeholderTextColor="#9CA3AF"
            value={manualBarcode}
            onChangeText={setManualBarcode}
            keyboardType="default"
            autoCapitalize="none"
            returnKeyType="go"
            onSubmitEditing={handleManualSubmit}
          />
          <TouchableOpacity
            style={[styles.lookUpButton, !manualBarcode.trim() && styles.lookUpButtonDisabled]}
            onPress={handleManualSubmit}
            disabled={!manualBarcode.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.lookUpButtonText}>Look Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Camera active ───
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
        }}
        onBarcodeScanned={scanLocked ? undefined : handleBarcodeScan}
        onCameraReady={() => {
          setCameraReady(true);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
        }}
      />

      <ScanOverlay />

      <View style={styles.headerBox}>
        <Text style={styles.title}>🌿 EcoScan AI</Text>
        <Text style={styles.subtitle}>Center a barcode in the frame to scan</Text>
      </View>

      <View style={styles.footerBox}>
        {!cameraReady ? (
          <View style={styles.loadingPill}>
            <Animated.View style={{ opacity: pulseAnim }}>
              <ActivityIndicator color={colors.primary} size="small" />
            </Animated.View>
            <Text style={styles.loadingText}>Starting camera...</Text>
          </View>
        ) : (
          <View style={styles.readyPill}>
            <Text style={styles.readyDot}>●</Text>
            <Text style={styles.readyText}>Scanner ready</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.manualEntryToggle}
          onPress={() => setShowManualEntry(!showManualEntry)}
          activeOpacity={0.7}
        >
          <Text style={styles.manualEntryToggleText}>
            {showManualEntry ? 'Hide manual entry' : 'Enter barcode manually'}
          </Text>
        </TouchableOpacity>

        {showManualEntry && (
          <View style={styles.inlineManualEntry}>
            <TextInput
              style={styles.manualInputInline}
              placeholder="Type barcode..."
              placeholderTextColor="#9CA3AF"
              value={manualBarcode}
              onChangeText={setManualBarcode}
              keyboardType="default"
              autoCapitalize="none"
              returnKeyType="go"
              onSubmitEditing={handleManualSubmit}
            />
            <TouchableOpacity
              style={[styles.inlineLookUp, !manualBarcode.trim() && styles.lookUpButtonDisabled]}
              onPress={handleManualSubmit}
              disabled={!manualBarcode.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.lookUpButtonText}>Go</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.footerMeta}>EAN-13 · UPC · Code-128 · QR</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1A',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: colors.background,
  },

  // Permission / fallback screens
  permissionIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  permissionEmoji: {
    fontSize: 36,
  },
  permissionTitle: {
    fontSize: 26,
    color: colors.textPrimary,
    fontWeight: '800',
    textAlign: 'center',
  },
  permissionText: {
    marginTop: 10,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 300,
  },
  primaryButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 14,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  helperText: {
    marginTop: 14,
    color: colors.textSecondary,
    fontSize: 15,
  },

  // Manual barcode entry
  manualEntryBox: {
    marginTop: 24,
    width: '100%',
    maxWidth: 340,
  },
  manualEntryLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  manualInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lookUpButton: {
    marginTop: 10,
    backgroundColor: colors.primaryDark,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  lookUpButtonDisabled: {
    opacity: 0.5,
  },
  lookUpButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Camera view header/footer
  headerBox: {
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    marginHorizontal: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    color: '#065F46',
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 4,
    color: '#334155',
    fontSize: 14,
    fontWeight: '500',
  },

  footerBox: {
    marginTop: 'auto',
    marginBottom: Platform.OS === 'ios' ? 36 : 24,
    marginHorizontal: 18,
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  loadingPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 100,
  },
  loadingText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
  },

  readyPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 100,
  },
  readyDot: {
    color: colors.primary,
    fontSize: 10,
  },
  readyText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '700',
  },

  manualEntryToggle: {
    marginTop: 12,
  },
  manualEntryToggleText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },

  inlineManualEntry: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  manualInputInline: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inlineLookUp: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footerMeta: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
