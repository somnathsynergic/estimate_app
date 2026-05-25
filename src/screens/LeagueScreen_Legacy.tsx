import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Text as NativeText,
} from 'react-native';
import { Text, Card, ProgressBar, Divider } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import normalize from 'react-native-normalize';

const MaterialCommunityIcons = ({ name, size, color, style }: any) => {
  const emojiMap: { [key: string]: string } = {
    'coin': '🪙',
    'trophy': '🏆',
    'store': '🏪',
    'leaf': '🍃',
    'target': '🎯',
    'domain': '🏢',
    'flash': '⚡',
    'help-circle': '❓',
  };
  return (
    <NativeText style={[{ fontSize: size, color: color, textAlign: 'center' }, style]}>
      {emojiMap[name] || '•'}
    </NativeText>
  );
};
import { usePaperColorScheme } from '../theme/theme';
import useGamification from '../hooks/api/useGamification';

const { width } = Dimensions.get('window');

const BreakdownItem = ({ icon, label, coins, color = '#757575' }) => (
  <View style={styles.breakdownItem}>
    <View style={styles.breakdownLabelRow}>
      <MaterialCommunityIcons name={icon || 'help-circle'} size={16} color={color} />
      <Text style={styles.breakdownLabel}>{label}</Text>
    </View>
    <View style={styles.breakdownCoinsRow}>
      <Text style={styles.breakdownCoins}>{coins || 0}</Text>
    </View>
  </View>
);

const RewardInfoItem = ({ icon, label, desc, reward, color = '#2196F3' }) => (
  <View style={styles.rewardItem}>
    <View style={[styles.rewardIconContainer, { backgroundColor: color + '20' }]}>
      <MaterialCommunityIcons name={icon || 'help-circle'} size={24} color={color} />
    </View>
    <View style={styles.rewardTextContainer}>
      <Text style={styles.rewardLabel}>{label}</Text>
      <Text style={styles.rewardDesc}>{desc}</Text>
    </View>
    <View style={styles.rewardBadge}>
      <Text style={styles.rewardValueText}>{reward}</Text>
    </View>
  </View>
);

const RULE_ICON_MAP: { [key: string]: { icon: string; color: string } } = {
  'PER_QTY':   { icon: 'leaf',  color: '#4CAF50' },
  'PER_SHOP':  { icon: 'flash', color: '#FFB800' },
};

const getRuleStyle = (calcType: string, ruleName: string) => {
  const nameLower = ruleName.toLowerCase();
  if (nameLower.includes('flake') || nameLower.includes('sky'))   return { icon: 'leaf',   color: '#4CAF50' };
  if (nameLower.includes('classic') || nameLower.includes('connect')) return { icon: 'flash',  color: '#FFB800' };
  if (nameLower.includes('power') || nameLower.includes('bonus'))  return { icon: 'target', color: '#F44336' };
  return RULE_ICON_MAP[calcType] || { icon: 'coin', color: '#2196F3' };
};

const LeagueScreen = () => {
  const theme = usePaperColorScheme();
  const { fetchDashboard, fetchLeaderboard, userId } = useGamification();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const loadData = async (showFullSpinner = true) => {
    if (showFullSpinner) {
      setLoading(true);
    }
    try {
      const [dash, leader] = await Promise.all([
        fetchDashboard(),
        fetchLeaderboard()
      ]);
      if (dash.status === 1) setDashboardData(dash.data);
      if (leader.status === 1) setLeaderboard(leader.data);
    } catch (error) {
      console.error("Error loading gamification data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadDataRef = useRef(loadData);
  useEffect(() => {
    loadDataRef.current = loadData;
  });

  useFocusEffect(
    useCallback(() => {
      loadDataRef.current(true);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData(false);
  };

  const todayIndex = new Date().getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  const streakConfig = dashboardData?.streak_config || {};
  const currentStreakDay = dashboardData?.today?.streak_day || 0;

  const getDayStreakInfo = (dayKey: string) => {
    const dayData = dashboardData?.streak_status?.[dayKey];
    const isCompleted = !!dayData?.completed;
    
    // Read the actual streak day this user achieved (if completed) or could achieve (if potential)
    const actualStreakDay = (isCompleted ? dayData?.streak_day : dayData?.potential_streak_day) || 1;
    
    const bonusVal = streakConfig[actualStreakDay.toString()] || (actualStreakDay * 10);
    return {
      completed: isCompleted,
      bonus: `+${Math.round(parseFloat(bonusVal.toString()))}`
    };
  };

  const streakDays = [
    { day: 'Mon', ...getDayStreakInfo('1'), active: todayIndex === 1 },
    { day: 'Tue', ...getDayStreakInfo('2'), active: todayIndex === 2 },
    { day: 'Wed', ...getDayStreakInfo('3'), active: todayIndex === 3 },
    { day: 'Thu', ...getDayStreakInfo('4'), active: todayIndex === 4 },
    { day: 'Fri', ...getDayStreakInfo('5'), active: todayIndex === 5 },
    { day: 'Sat', ...getDayStreakInfo('6'), active: todayIndex === 6 },
  ];

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const todayCoins = dashboardData?.today?.total_coins || 0;
  const totalBalance = dashboardData?.total_balance || 0;
  const quest = dashboardData?.active_quest;
  const questProgress = quest ? (quest.achieved_qty / quest.target_qty) : 0;
  const myRankIndex = leaderboard.findIndex(l => l.user_id === userId);
  const myRank = myRankIndex !== -1 ? (myRankIndex + 1).toString() : '-';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Hero Section */}
        <LinearGradient
          colors={['#004AAD', '#006BFF']}
          style={styles.headerHero}
        >
          <View style={styles.headerTop}>
            <View style={styles.headerBrand}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFB800', justifyContent: 'center', alignItems: 'center' }}>
                <NativeText style={{ color: '#000', fontSize: 16, fontWeight: 'bold' }}>
                  {(userId && userId.length > 0) ? userId[0].toUpperCase() : 'U'}
                </NativeText>
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.headerTitle}>CIPL DS LEAGUE</Text>
              </View>
            </View>
            <Text style={styles.headerDate}>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
          </View>

          <View style={styles.userInfoRow}>
            <Text style={styles.userName}>{userId || 'USER'}</Text>
            <View style={styles.rankBadge}>
              <Text style={styles.rankNumber}>#{myRank}</Text>
              <Text style={styles.rankLabel}>RANK</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.contentPadding}>
          {/* Coins Summary */}
          <View style={styles.summaryRow}>
            <Card style={[styles.summaryCard, { backgroundColor: '#2196F3' }]}>
              <Card.Content>
                <View style={styles.cardHeaderRow}>
                  <MaterialCommunityIcons name="coin" size={20} color="#FFF" />
                  <Text style={styles.summaryCardTitle}>TODAY'S COINS</Text>
                </View>
                <Text style={styles.summaryCardValue}>{todayCoins}</Text>
              </Card.Content>
            </Card>
            <Card style={[styles.summaryCard, { backgroundColor: '#4CAF50' }]}>
              <Card.Content>
                <View style={styles.cardHeaderRow}>
                  <MaterialCommunityIcons name="trophy" size={20} color="#FFF" />
                  <Text style={styles.summaryCardTitle}>TOTAL COINS</Text>
                </View>
                <Text style={styles.summaryCardValue}>{totalBalance}</Text>
              </Card.Content>
            </Card>
          </View>

          {/* Breakdown & Quest Row */}
          <View style={styles.row}>
            <Card style={[styles.halfCard, styles.elevationLow]}>
              <Card.Content>
                <Text style={styles.sectionTitle}>TODAY'S BREAKDOWN</Text>
                {(!dashboardData?.today_breakdown || dashboardData.today_breakdown.length === 0) ? (
                  <Text style={{ textAlign: 'center', color: '#757575', fontSize: 12, marginVertical: 20 }}>No coins earned today.</Text>
                ) : (
                  dashboardData.today_breakdown.map((item: any, idx: number) => {
                    let icon = 'coin';
                    let color = '#2196F3';
                    const categoryLower = item.category.toLowerCase();
                    if (categoryLower.includes('unique') || categoryLower.includes('shop')) {
                      icon = 'store';
                      color = '#4CAF50';
                    } else if (categoryLower.includes('quest')) {
                      icon = 'trophy';
                      color = '#FFB800';
                    } else if (categoryLower.includes('streak')) {
                      icon = 'flash';
                      color = '#FF5722';
                    } else if (categoryLower.includes('power')) {
                      icon = 'target';
                      color = '#F44336';
                    } else if (categoryLower.includes('flake')) {
                      icon = 'leaf';
                      color = '#81C784';
                    }
                    
                    const displayLabel = item.category
                      .split('_')
                      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                      .join(' ');

                    return (
                      <BreakdownItem 
                        key={`breakdown_${idx}`}
                        icon={icon} 
                        label={displayLabel} 
                        coins={Math.round(item.coins)} 
                        color={color} 
                      />
                    );
                  })
                )}
                <Divider style={styles.divider} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Today</Text>
                  <Text style={styles.totalValue}>{todayCoins}</Text>
                </View>
              </Card.Content>
            </Card>

            <Card style={[styles.halfCard, styles.elevationLow]}>
              <Card.Content>
                <Text style={styles.sectionTitle}>TODAY'S QUEST</Text>
                {quest ? (
                  <>
                    <Text style={styles.questTitle}>
                      {quest.quest_name || ((quest.quest_type === 'POWER_SHOP' || quest.quest_type === 'POWER_SHOPS')
                        ? `Bill ${quest.target_qty} power shops` 
                        : ((quest.quest_type === 'UNIQUE_SHOP' || quest.quest_type === 'UNIQUE_SHOPS')
                          ? `Bill ${quest.target_qty} unique shops` 
                          : `Sell ${quest.target_qty} packets of ${quest.item_name || ''}`))}
                    </Text>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressText}>
                        {`${quest.achieved_qty} / ${quest.target_qty} ${(quest.quest_type === 'POWER_SHOP' || quest.quest_type === 'POWER_SHOPS') ? 'bills' : ((quest.quest_type === 'UNIQUE_SHOP' || quest.quest_type === 'UNIQUE_SHOPS') ? 'shops' : 'pkts')}`}
                      </Text>
                      <Text style={styles.progressPercentage}>{`${Math.round(questProgress * 100)}%`}</Text>
                    </View>
                    <ProgressBar progress={questProgress} color="#2196F3" style={styles.progressBar} />
                    <TouchableOpacity style={[styles.questStatusButton, quest.completed_flag === 'Y' && { backgroundColor: '#E8F5E9', borderColor: '#81C784' }]}>
                      <Text style={[styles.questStatusText, quest.completed_flag === 'Y' && { color: '#2E7D32' }]}>
                        {quest.completed_flag === 'Y' ? 'COMPLETED' : 'IN PROGRESS'}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={styles.questTitle}>No active quest today.</Text>
                )}
              </Card.Content>
            </Card>
          </View>

          {/* Weekly Streak */}
          <Card style={[styles.fullCard, styles.elevationLow]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>WEEKLY STREAK (MON - SAT)</Text>
              <Text style={{ textAlign: 'center', fontSize: normalize(13), fontFamily: 'ProductSans-Bold', color: '#FFB800', marginTop: 4, marginBottom: 12 }}>
                {(() => {
                  if (todayIndex === 0) {
                    return '🎯 Rest day! New quests start on Monday.';
                  }
                  const todayKey = todayIndex.toString();
                  const todayStatus = dashboardData?.streak_status?.[todayKey];
                  const potentialStreakDay = todayStatus?.potential_streak_day || 1;
                  const potentialReward = streakConfig[potentialStreakDay.toString()] || (potentialStreakDay * 10);
                  
                  if (currentStreakDay > 0) {
                    const earnedReward = streakConfig[currentStreakDay.toString()] || (currentStreakDay * 10);
                    return `🔥 Day ${currentStreakDay} Streak: Reward +${Math.round(parseFloat(earnedReward.toString()))} coins earned!`;
                  } else {
                    return `🎯 Complete today's quest to get Day ${potentialStreakDay} Streak (+${Math.round(parseFloat(potentialReward.toString()))} coins!)`;
                  }
                })()}
              </Text>
              <View style={styles.streakContainer}>
                {streakDays.map((day, index) => (
                  <View key={index} style={styles.streakDayItem}>
                    <View style={[
                      styles.streakCircle,
                      day.completed ? styles.streakCircleCompleted : styles.streakCirclePending,
                      day.active && { borderColor: '#FFD600', borderWidth: 2.5, elevation: 4, shadowColor: '#FFD600', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 }
                    ]}>
                      <Text style={[
                        styles.streakBonus,
                        day.completed ? { color: '#FFF' } : { color: '#2196F3' }
                      ]}>
                        {day.bonus}
                      </Text>
                    </View>
                    <Text style={styles.streakDayLabel}>{day.day}</Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* Leaderboard */}
          <Card style={[styles.fullCard, styles.elevationLow]}>
            <Card.Content>
              <View style={styles.leaderboardHeader}>
                <MaterialCommunityIcons name="trophy" size={24} color="#FFB800" />
                <Text style={styles.leaderboardTitle}>LEADERBOARD</Text>
              </View>
              
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { width: '10%' }]}>RK</Text>
                <Text style={[styles.tableHeaderText, { width: '40%' }]}>NAME</Text>
                <Text style={[styles.tableHeaderText, { width: '20%', textAlign: 'center' }]}>TODAY</Text>
                <Text style={[styles.tableHeaderText, { width: '20%', textAlign: 'center' }]}>TOTAL</Text>
                <Text style={[styles.tableHeaderText, { width: '10%', textAlign: 'center' }]}>S</Text>
              </View>

              {leaderboard.map((item, index) => (
                <View key={index} style={[
                  styles.tableRow,
                  item.user_id === userId && { backgroundColor: '#8BC34A', borderRadius: 12 }
                ]}>
                  <View style={[styles.rankCircle, item.user_id === userId && { backgroundColor: 'transparent' }]}>
                    <Text style={[styles.rankText, item.user_id === userId && { color: '#FFF' }]}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.rowName, { width: '40%' }, item.user_id === userId && { color: '#FFF' }]}>{item.user_name}</Text>
                  <View style={[styles.todayBadge, { width: '20%' }, item.user_id === userId && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Text style={[styles.todayText, item.user_id === userId && { color: '#FFF' }]}>{item.total_earned || 0}</Text>
                  </View>
                  <Text style={[styles.rowTotal, { width: '20%' }, item.user_id === userId && { color: '#FFF' }]}>{item.total_earned || 0}</Text>
                  <View style={[styles.streakFire, { width: '10%' }]}>
                    {item.max_streak > 0 && (
                      <View style={styles.fireCircle}>
                        <Text style={styles.fireText}>{item.max_streak}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>

          {/* All Assigned Quests Section */}
          <Card style={[styles.fullCard, styles.elevationLow, { marginBottom: normalize(15) }]}>
            <Card.Content>
              <Text style={styles.sectionTitle}>ALL ASSIGNED QUESTS</Text>
              <Divider style={{ marginVertical: 10 }} />
              {(!dashboardData?.quests || dashboardData.quests.length === 0) ? (
                <Text style={{ textAlign: 'center', color: '#757575', marginVertical: 10 }}>No quests assigned today.</Text>
              ) : (
                dashboardData.quests.map((q: any, idx: number) => {
                  const qProgress = q.target_qty > 0 ? (q.achieved_qty / q.target_qty) : 0;
                  return (
                    <View key={`quest_${idx}`} style={{ marginBottom: idx < dashboardData.quests.length - 1 ? 15 : 0 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <MaterialCommunityIcons name="trophy" size={20} color="#FFB800" style={{ marginRight: 8 }} />
                          <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#333', flexShrink: 1 }}>{q.quest_name}</Text>
                        </View>
                        <View style={{ backgroundColor: q.completed_flag === 'Y' ? '#E8F5E9' : '#FFF3E0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                          <Text style={{ fontSize: 11, fontWeight: 'bold', color: q.completed_flag === 'Y' ? '#2E7D32' : '#E65100' }}>
                            {q.completed_flag === 'Y' ? 'COMPLETED' : 'IN PROGRESS'}
                          </Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{ fontSize: 12, color: '#666' }}>
                          Progress: {q.achieved_qty} / {q.target_qty} {(q.quest_type === 'POWER_SHOP' || q.quest_type === 'POWER_SHOPS') ? 'bills' : ((q.quest_type === 'UNIQUE_SHOP' || q.quest_type === 'UNIQUE_SHOPS' || q.quest_type === 'ITEMS_PER_SHOP') ? 'shops' : 'pkts')}
                        </Text>
                      </View>
                      <ProgressBar progress={qProgress} color="#FFB800" style={{ height: 6, borderRadius: 3 }} />
                      {idx < dashboardData.quests.length - 1 && <Divider style={{ marginTop: 12 }} />}
                    </View>
                  );
                })
              )}
            </Card.Content>
          </Card>

          {/* Daily Coin Incentives Section */}
          <Card style={[styles.fullCard, styles.elevationLow, { marginBottom: 40 }]}>
            <Card.Content>
              <Text style={styles.sectionTitle}>DAILY COIN INCENTIVES</Text>
              <Divider style={{ marginVertical: 10 }} />

              {(() => {
                const uniqueShopRule = (dashboardData?.coin_rules ?? []).find(
                  (r: any) => 
                    r.rule_name === 'UNIQUE_SHOP' || 
                    r.rule_name === 'UNIQUE_SHOPS' || 
                    r.calculation_type === 'UNIQUE_SHOP' ||
                    r.calculation_type === 'UNIQUE_SHOPS'
                );
                const powerShopRule = (dashboardData?.coin_rules ?? []).find(
                  (r: any) => 
                    r.rule_name === 'POWER_SHOP' || 
                    r.rule_name === 'POWER_SHOPS' || 
                    r.calculation_type === 'POWER_SHOP' ||
                    r.calculation_type === 'POWER_SHOPS'
                );
                const brandRules = (dashboardData?.coin_rules ?? []).filter(
                  (r: any) => 
                    r.rule_name !== 'UNIQUE_SHOP' && 
                    r.rule_name !== 'UNIQUE_SHOPS' && 
                    r.calculation_type !== 'UNIQUE_SHOP' && 
                    r.calculation_type !== 'UNIQUE_SHOPS' && 
                    r.rule_name !== 'POWER_SHOP' && 
                    r.rule_name !== 'POWER_SHOPS' && 
                    r.calculation_type !== 'POWER_SHOP' && 
                    r.calculation_type !== 'POWER_SHOPS'
                );

                return (
                  <>
                    {/* Unique shop bonus */}
                    {uniqueShopRule && (
                      <RewardInfoItem
                        icon="domain"
                        label="Bill a shop"
                        desc="Every unique shop billed in a day"
                        reward={`+${Math.round(uniqueShopRule.coin_value)} coin${Math.round(uniqueShopRule.coin_value) > 1 ? 's' : ''}`}
                        color="#2196F3"
                      />
                    )}

                    {/* Dynamic brand coin rules from backend */}
                    {brandRules.map((rule: any, idx: number) => {
                      const { icon, color } = getRuleStyle(rule.calculation_type, rule.rule_name);
                      const rewardLabel = rule.calculation_type === 'PER_QTY'
                        ? `+${rule.coin_value % 1 === 0 ? Math.round(rule.coin_value) : rule.coin_value} / pkt`
                        : `+${rule.coin_value % 1 === 0 ? Math.round(rule.coin_value) : rule.coin_value} / bill`;
                      const desc = rule.calculation_type === 'PER_QTY'
                        ? `Every packet of ${rule.item_name} sold`
                        : `Every bill containing ${rule.item_name}`;
                      return (
                        <RewardInfoItem
                          key={idx}
                          icon={icon}
                          label={rule.item_name}
                          desc={desc}
                          reward={rewardLabel}
                          color={color}
                        />
                      );
                    })}

                    {/* Power shop bonus */}
                    {powerShopRule && (
                      <RewardInfoItem
                        icon="target"
                        label="Power shop bonus"
                        desc={`Bill ${powerShopRule.item_id && powerShopRule.item_id > 0 ? powerShopRule.item_id : 10}+ different SKUs at one shop`}
                        reward={`+${Math.round(powerShopRule.coin_value)} / shop`}
                        color="#F44336"
                      />
                    )}

                    {/* Weekly Streak Bonus */}
                    {Object.keys(streakConfig).length > 0 && (
                      <RewardInfoItem
                        icon="flash"
                        label="Weekly Streak Bonus"
                        desc="Build a daily quest streak (Mon - Sat)"
                        reward={`+${Math.round(parseFloat(streakConfig["1"] || "10"))} to +${Math.round(parseFloat(streakConfig["6"] || "60"))} coins`}
                        color="#FF9800"
                      />
                    )}
                  </>
                );
              })()}
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
      
      <LinearGradient
        colors={['#004AAD', '#006BFF']}
        style={styles.bottomBar}
      >
        <Text style={styles.bottomBarText}>COMPLETE . EARN . WIN</Text>
      </LinearGradient>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentPadding: {
    padding: normalize(16),
  },
  headerHero: {
    paddingTop: normalize(20),
    paddingBottom: normalize(30),
    paddingHorizontal: normalize(20),
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(20),
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: normalize(14),
    fontFamily: 'ProductSans-Bold',
    letterSpacing: 1,
  },
  headerDate: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: normalize(12),
    fontFamily: 'ProductSans-Medium',
  },
  userInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    color: '#FFF',
    fontSize: normalize(32),
    fontFamily: 'ProductSans-Bold',
    fontStyle: 'italic',
  },
  rankBadge: {
    backgroundColor: '#8BC34A',
    paddingHorizontal: normalize(15),
    paddingVertical: normalize(10),
    borderRadius: 15,
    alignItems: 'center',
  },
  rankNumber: {
    color: '#000',
    fontSize: normalize(20),
    fontFamily: 'ProductSans-Bold',
  },
  rankLabel: {
    color: '#000',
    fontSize: normalize(10),
    fontFamily: 'ProductSans-Bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: normalize(-20),
    marginBottom: normalize(16),
  },
  summaryCard: {
    width: (width - normalize(48)) / 2,
    borderRadius: 15,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalize(8),
  },
  summaryCardTitle: {
    color: '#FFF',
    fontSize: normalize(10),
    fontFamily: 'ProductSans-Bold',
    marginLeft: 5,
  },
  summaryCardValue: {
    color: '#FFF',
    fontSize: normalize(36),
    fontFamily: 'ProductSans-Bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: normalize(16),
  },
  halfCard: {
    width: (width - normalize(48)) / 2,
    borderRadius: 15,
  },
  fullCard: {
    width: '100%',
    borderRadius: 15,
    marginBottom: normalize(16),
  },
  elevationLow: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: normalize(12),
    fontFamily: 'ProductSans-Bold',
    color: '#3F51B5',
    marginBottom: normalize(12),
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(8),
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: normalize(11),
    fontFamily: 'ProductSans-Medium',
    color: '#333',
    marginLeft: 5,
  },
  breakdownCoinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIcon: {
    fontSize: normalize(10),
    marginRight: 2,
  },
  breakdownCoins: {
    fontSize: normalize(12),
    fontFamily: 'ProductSans-Bold',
    color: '#000',
  },
  divider: {
    marginVertical: normalize(8),
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: normalize(13),
    fontFamily: 'ProductSans-Bold',
    color: '#3F51B5',
  },
  totalValue: {
    fontSize: normalize(14),
    fontFamily: 'ProductSans-Bold',
    color: '#000',
  },
  questTitle: {
    fontSize: normalize(12),
    fontFamily: 'ProductSans-Medium',
    color: '#333',
    marginBottom: normalize(10),
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: normalize(5),
  },
  progressText: {
    fontSize: normalize(11),
    fontFamily: 'ProductSans-Bold',
    color: '#666',
  },
  progressPercentage: {
    fontSize: normalize(11),
    fontFamily: 'ProductSans-Medium',
    color: '#999',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: normalize(15),
  },
  questStatusButton: {
    backgroundColor: '#FFF5F0',
    paddingVertical: normalize(8),
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  questStatusText: {
    color: '#FF9800',
    fontSize: normalize(11),
    fontFamily: 'ProductSans-Bold',
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: normalize(10),
  },
  streakDayItem: {
    alignItems: 'center',
  },
  streakCircle: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  streakCircleCompleted: {
    backgroundColor: '#8BC34A',
  },
  streakCircleActive: {
    backgroundColor: '#8BC34A',
    borderWidth: 2,
    borderColor: '#FFD600',
  },
  streakCirclePending: {
    backgroundColor: '#E3EFFF',
    borderWidth: 1,
    borderColor: '#B0CFFF',
  },
  streakBonus: {
    color: '#FFF',
    fontSize: normalize(10),
    fontFamily: 'ProductSans-Bold',
  },
  streakDayLabel: {
    fontSize: normalize(10),
    fontFamily: 'ProductSans-Medium',
    color: '#666',
  },
  leaderboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: normalize(20),
  },
  leaderboardTitle: {
    fontSize: normalize(24),
    fontFamily: 'ProductSans-Bold',
    color: '#006BFF',
    fontStyle: 'italic',
    marginLeft: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  tableHeaderText: {
    fontSize: normalize(10),
    fontFamily: 'ProductSans-Bold',
    color: '#999',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: normalize(10),
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  rankCircle: {
    width: normalize(24),
    height: normalize(24),
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: {
    fontSize: normalize(11),
    fontFamily: 'ProductSans-Bold',
    color: '#2196F3',
  },
  rowName: {
    fontSize: normalize(13),
    fontFamily: 'ProductSans-Medium',
    color: '#333',
  },
  todayBadge: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  todayText: {
    fontSize: normalize(11),
    fontFamily: 'ProductSans-Bold',
    color: '#4CAF50',
  },
  rowTotal: {
    fontSize: normalize(13),
    fontFamily: 'ProductSans-Bold',
    color: '#000',
    textAlign: 'center',
  },
  streakFire: {
    alignItems: 'center',
  },
  fireCircle: {
    width: normalize(20),
    height: normalize(20),
    borderRadius: 10,
    backgroundColor: '#FFB800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fireText: {
    fontSize: normalize(10),
    fontFamily: 'ProductSans-Bold',
    color: '#000',
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalize(15),
  },
  rewardIconContainer: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rewardTextContainer: {
    flex: 1,
  },
  rewardLabel: {
    fontSize: normalize(14),
    fontFamily: 'ProductSans-Bold',
    color: '#000',
  },
  rewardDesc: {
    fontSize: normalize(11),
    fontFamily: 'ProductSans-Medium',
    color: '#666',
  },
  rewardBadge: {
    backgroundColor: '#FFF9E1',
    borderWidth: 1,
    borderColor: '#FFB800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  rewardValueText: {
    color: '#855E00',
    fontSize: normalize(12),
    fontFamily: 'ProductSans-Bold',
  },
  bottomBar: {
    paddingVertical: normalize(12),
    alignItems: 'center',
  },
  bottomBarText: {
    color: '#FFF',
    fontSize: normalize(12),
    fontFamily: 'ProductSans-Bold',
    letterSpacing: 2,
  },
});

export default LeagueScreen;
