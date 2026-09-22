// [GAMIFICATION SCREEN] - Mobile DS League Screen (without leaderboard)
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing,
  Text as NativeText,
} from 'react-native';
import { Text } from 'react-native-paper';
import normalize from 'react-native-normalize';

const MaterialCommunityIcons = ({ name, size, color, style }: any) => {
  const emojiMap: { [key: string]: string } = {
    coin: '🪙',
    trophy: '🏆',
    store: '🏪',
    leaf: '🍃',
    target: '🎯',
    domain: '🏢',
    flash: '⚡',
  };
  const char = emojiMap[name] || name;
  return <NativeText style={[{ fontSize: size }, style]}>{char}</NativeText>;
};

const getRuleStyle = (calcType: string, ruleName: string) => {
  if (ruleName.includes('flake') || ruleName.includes('sky')) return { icon: 'leaf', color: '#4CAF50' };
  if (ruleName.includes('classic') || ruleName.includes('connect')) return { icon: 'flash', color: '#FFB800' };
  if (ruleName.includes('power') || ruleName.includes('bonus')) return { icon: 'target', color: '#F44336' };
  return RULE_ICON_MAP[calcType] || { icon: 'coin', color: '#2196F3' };
};

const GamificationScreen = () => {
  const theme = usePaperColorScheme();
  const { fetchDashboard, userId } = useGamification();

  const spinValue = useRef(new Animated.Value(0)).current;
  const flashValue = useRef(new Animated.Value(1)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  const ENABLE_ANIMATIONS = false; // Set to true to re‑enable heavy animations

  useFocusEffect(
    React.useCallback(() => {
      const spinAnim = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      const flashAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(flashValue, { toValue: 0.15, duration: 450, useNativeDriver: true }),
          Animated.timing(flashValue, { toValue: 1, duration: 450, useNativeDriver: true }),
        ])
      );
      const pulseAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, { toValue: 1.25, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseValue, { toValue: 0.95, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseValue, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ])
      );
      if (ENABLE_ANIMATIONS) {
        spinAnim.start();
        flashAnim.start();
        pulseAnim.start();
      }
      return () => {
        if (ENABLE_ANIMATIONS) {
          spinAnim.stop();
          flashAnim.stop();
          pulseAnim.stop();
        }
      };
    }, [])
  );

  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    fetchDashboard(userId).then(setDashboardData);
  }, [userId]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Gamification UI */}
        <View style={styles.gamificationSection}>/* existing gamification UI placeholder */</View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gamificationSection: { /* style as needed */ },
});

export default GamificationScreen;
