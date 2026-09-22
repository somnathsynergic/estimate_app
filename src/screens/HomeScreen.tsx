import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LeagueScreen from './LeagueScreen';

// Simple custom top tab implementation without react-native-tab-view
const CustomTopTabs = () => {
  const [selected, setSelected] = useState<'Gamification' | 'Leaderboard'>('Gamification');

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, selected === 'Gamification' && styles.tabItemActive]}
          onPress={() => setSelected('Gamification')}
        >
          <Text style={styles.tabLabel}>Gamification</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, selected === 'Leaderboard' && styles.tabItemActive]}
          onPress={() => setSelected('Leaderboard')}
        >
          <Text style={styles.tabLabel}>Leaderboard</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        {selected === 'Gamification' ? (
          <LeagueScreen showLeaderboardOnly={false} />
        ) : (
          <LeagueScreen showLeaderboardOnly={true} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090446' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#090446',
    borderBottomWidth: 2,
    borderBottomColor: '#FFB800',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabItemActive: {
    borderBottomWidth: 4,
    borderBottomColor: '#FFB800',
  },
  tabLabel: { color: '#fff', fontSize: 12 },
  content: { flex: 1 },
});

export default CustomTopTabs;
