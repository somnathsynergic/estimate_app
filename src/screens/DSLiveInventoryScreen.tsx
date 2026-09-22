import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Card } from "react-native-paper";
import { usePaperColorScheme } from "../theme/theme";
import useDSInventory from "../hooks/api/useDSInventory";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import navigationRoutes from "../routes/navigationRoutes";
import { BASE_URL_ITEM_IMG } from "../config/config";

export default function DSLiveInventoryScreen() {
  const theme = usePaperColorScheme();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { fetchDashboard } = useDSInventory();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchDashboard();
      if (res.status === 1) {
        setInventory(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <SafeAreaView style={[{ backgroundColor: theme.colors.primary, height: "100%" }]}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={{ padding: 20 }}>
          <Text variant="titleLarge" style={{ color: "#FFFFFF", marginBottom: 10, textAlign: "center" }}>
            Live Inventory
          </Text>
          {loading ? (
            <ActivityIndicator animating={true} size="large" color="#FFFFFF" />
          ) : (
            inventory?.length > 0 ? (
              inventory.map((item, i) => (
                <Card key={i} style={{ marginVertical: 5 }}>
                  <Card.Content style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {item.item_img ? (
                      <Image source={{ uri: BASE_URL_ITEM_IMG + item.item_img }} style={{ width: 60, height: 60, resizeMode: "contain", marginRight: 15 }} />
                    ) : null}
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                        {item.item_name || `Item #${item.item_id}`}
                      </Text>
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        Packets: {item.packet}
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              ))
            ) : (
              <Text variant="bodyMedium">No stock available.</Text>
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});
