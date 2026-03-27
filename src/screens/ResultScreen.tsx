import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { EcoScoreBadge } from '../components/EcoScoreBadge';
import { fetchScanResult } from '../services/api';
import { colors } from '../theme/colors';
import type { RootStackParamList, ScanResponse } from '../types';

type ResultNavigation = NativeStackNavigationProp<RootStackParamList, 'Result'>;

const fallbackData: ScanResponse = {
  productName: 'Unknown Product',
  image: 'https://images.unsplash.com/photo-1506806732259-39c2d0268443?auto=format&fit=crop&w=800&q=80',
  carbonFootprint: 'N/A',
  ecoScore: 'C',
  impact: 'Equivalent to driving 0 km',
  alternatives: [],
};

export const ResultScreen = () => {
  const navigation = useNavigation<ResultNavigation>();
  const route = useRoute();
  const { barcode } = route.params as RootStackParamList['Result'];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResponse | null>(null);

  // Animated entry
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Shimmer animation for loading skeleton
  useEffect(() => {
    if (!loading) return;
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [loading, shimmerAnim]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchScanResult(barcode);
        if (isMounted) {
          setResult(data);
        }
      } catch {
        if (isMounted) {
          setError('Could not fetch product insights. Please try scanning again.');
          setResult(fallbackData);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          // Trigger entry animation
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 500,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 500,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]).start();
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [barcode, fadeAnim, slideAnim]);

  const product = useMemo(() => result ?? fallbackData, [result]);

  if (loading) {
    return (
      <View style={styles.loaderScreen}>
        <LinearGradient
          colors={['#F0FDF4', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loaderCard}
        >
          <View style={styles.shimmerIcon}>
            <Text style={styles.shimmerEmoji}>🧪</Text>
          </View>
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 16 }} />
          <Text style={styles.loaderTitle}>Analyzing Product</Text>
          <Text style={styles.loaderSubtitle}>Fetching carbon footprint insights...</Text>

          {/* Skeleton placeholders */}
          <View style={styles.skeletonGroup}>
            <Animated.View style={[styles.skeletonLine, styles.skeletonWide, { opacity: shimmerAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 0.7, 0.3] }) }]} />
            <Animated.View style={[styles.skeletonLine, styles.skeletonMedium, { opacity: shimmerAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 0.6, 0.2] }) }]} />
            <Animated.View style={[styles.skeletonLine, styles.skeletonNarrow, { opacity: shimmerAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 0.5, 0.3] }) }]} />
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <LinearGradient
          colors={['#ECFDF5', '#F0FDF4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerCard}
        >
          <Text style={styles.appTitle}>🌿 EcoScan AI</Text>
          <View style={styles.barcodeChip}>
            <Text style={styles.barcodeLabel}>Barcode: {barcode}</Text>
          </View>
        </LinearGradient>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="cover" />
          <Text style={styles.productName}>{product.productName}</Text>
          <View style={styles.metricsRow}>
            <View style={styles.footprintContainer}>
              <Text style={styles.sectionLabel}>Carbon Footprint</Text>
              <Text style={styles.footprint}>{product.carbonFootprint}</Text>
            </View>
            <EcoScoreBadge score={product.ecoScore} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>🚗 Environmental Impact</Text>
          <Text style={styles.impactText}>{product.impact}</Text>
        </View>

        {product.alternatives.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>🌱 Eco-Friendly Alternatives</Text>
            {product.alternatives.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.alternativeRow}>
                <View style={styles.altBadge}>
                  <Text style={styles.altBadgeText}>{index + 1}</Text>
                </View>
                <Text style={styles.alternativeText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {product.alternatives.length === 0 && !error && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>🌱 Alternatives</Text>
            <Text style={styles.muted}>No eco-friendly alternatives found for this product.</Text>
          </View>
        )}
      </Animated.ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.replace('Scanner')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Scan Another Product</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 56,
    paddingBottom: 110,
    gap: 14,
  },

  // Header
  headerCard: {
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  appTitle: {
    color: '#065F46',
    fontSize: 24,
    fontWeight: '900',
  },
  barcodeChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  barcodeLabel: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '700',
  },

  // Error
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorEmoji: {
    fontSize: 18,
  },
  errorText: {
    flex: 1,
    color: '#991B1B',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },

  // Cards
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    shadowColor: 'rgba(15, 23, 42, 0.06)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  productName: {
    marginTop: 14,
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
  },
  metricsRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  footprintContainer: {
    flex: 1,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  footprint: {
    marginTop: 8,
    color: '#166534',
    fontSize: 30,
    fontWeight: '900',
  },
  impactText: {
    marginTop: 10,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 27,
  },
  muted: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },

  // Alternatives
  alternativeRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  altBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  altBadgeText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '800',
  },
  alternativeText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },

  // Bottom
  bottomActions: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  // Loader
  loaderScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  loaderCard: {
    width: '100%',
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  shimmerIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shimmerEmoji: {
    fontSize: 30,
  },
  loaderTitle: {
    marginTop: 14,
    color: '#065F46',
    fontSize: 22,
    fontWeight: '800',
  },
  loaderSubtitle: {
    marginTop: 6,
    color: '#047857',
    fontSize: 14,
    fontWeight: '600',
  },
  skeletonGroup: {
    marginTop: 24,
    width: '100%',
    gap: 10,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 7,
    backgroundColor: '#D1FAE5',
  },
  skeletonWide: {
    width: '90%',
  },
  skeletonMedium: {
    width: '65%',
  },
  skeletonNarrow: {
    width: '40%',
  },
});
