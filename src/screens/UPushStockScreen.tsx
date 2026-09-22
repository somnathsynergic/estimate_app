// Push Stock screen for user type U (no user dropdown)
import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, FlatList, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, TextInput, Searchbar, ActivityIndicator, IconButton, Divider } from "react-native-paper";
import { usePaperColorScheme } from "../theme/theme";
import ButtonPaper from "../components/ButtonPaper";
import useGKInventory from "../hooks/api/useGKInventory";
import { loginStorage } from "../storage/appStorage";
import axios from "axios";
import { ADDRESSES } from "../config/api_list";
import useCategoryItems from "../hooks/api/useCategoryItems";
import { Dropdown } from "react-native-element-dropdown"; // kept for style consistency if needed
import { BASE_URL_ITEM_IMG } from "../config/config";

export default function UPushStockScreen() {
  const theme = usePaperColorScheme();
  const { pushIssueStock, purchaseStock, userId } = useGKInventory();

  // Item list state (mirrors DSStockRequestScreen)
  const { fetchCategoryItems } = useCategoryItems();
  const [allItems, setAllItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [itemInputs, setItemInputs] = useState<Record<string, { packets: string; sticks: string }>>({});
  const [loadingItems, setLoadingItems] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load users (not needed) – we only need the logged‑in userId which is already available via hook

  // Load items on mount
  useEffect(() => {
    const loginStr = loginStorage.getString("login-data") || "{}";
    const loginData = JSON.parse(loginStr);
    const compId = loginData.comp_id;
    const brId = loginData.br_id;
    if (compId && brId) {
      fetchCategoryItems({ comp_id: compId, br_id: brId, catg_id: 0, user_id: loginData.user_id })
        .then(data => {
          const items = data?.msg || data?.list || data?.data || [];
          setAllItems(items);
          setFilteredItems(items);
        })
        .catch(err => console.error("Failed to fetch category items", err))
        .finally(() => setLoadingItems(false));
    } else {
      setLoadingItems(false);
    }
  }, []);

  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredItems(allItems);
      return;
    }
    const lower = query.toLowerCase();
    const filtered = allItems.filter((item: any) =>
      (item.item_name && item.item_name.toLowerCase().includes(lower)) ||
      (item.item_id && item.item_id.toString().includes(lower))
    );
    setFilteredItems(filtered);
  };

  const isInvalidSticks = (itemId: number) => {
    const input = itemInputs[itemId];
    if (!input || !input.sticks) return false;
    const sticksNum = Number(input.sticks) || 0;
    if (sticksNum <= 0) return false;
    const item = allItems.find(i => i.item_id === itemId);
    if (!item) return false;
    const perPkt = Number(item.sticks_per_packet) || 0;
    return perPkt > 0 && sticksNum % perPkt !== 0;
  };

  const handleSubmit = () => {
    // Validate that each item's sticks input is a multiple of sticks_per_packet
    const invalidItems: string[] = [];
    Object.entries(itemInputs).forEach(([itemIdStr, v]) => {
      const itemId = Number(itemIdStr);
      const sticksNum = Number(v.sticks) || 0;
      if (sticksNum <= 0) return;
      
      const item = allItems.find(i => i.item_id === itemId);
      if (item) {
        const perPkt = Number(item.sticks_per_packet) || 0;
        if (perPkt > 0 && sticksNum % perPkt !== 0) {
          invalidItems.push(`${item.item_name} (entered: ${sticksNum}, must be multiple of ${perPkt})`);
        }
      }
    });

    if (invalidItems.length > 0) {
      Alert.alert(
        "Invalid Quantities",
        "The following items must have sticks in multiples of their packets:\n\n" + invalidItems.join("\n")
      );
      return;
    }

    setSubmitting(true);
    const loginData = JSON.parse(loginStorage.getString("login-data") || "{}");
    const itemsPayload = Object.entries(itemInputs)
      .filter(([, v]) => v.packets || v.sticks)
      .map(([itemId, v]) => ({
        item_id: Number(itemId),
        packet: Number(v.packets) || 0,
        total_sticks: Number(v.sticks) || 0,
      }));
    pushIssueStock({
      comp_id: loginData.comp_id || 1,
      br_id: loginData.br_id || 1,
      user_id: userId, // logged‑in user
      fulfilled_by: userId,
      items: itemsPayload,
    })
      .then(() => {
        Alert.alert("Stock pushed successfully!");
        setItemInputs({});
      })
      .catch(err => Alert.alert("Error: " + err?.message))
      .finally(() => setSubmitting(false));
  };


  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      {item.item_img ? <Image source={{ uri: BASE_URL_ITEM_IMG + item.item_img }} style={styles.image} /> : null}
      <View style={styles.info}>
        <Text style={styles.title}>{item.item_name}</Text>
        <Text style={styles.subtitle}>ID: {item.item_id}</Text>
        <View style={styles.inputRow}>
          <TextInput
            mode="outlined"
            label={`Sticks (Multiple of ${item.sticks_per_packet || 1})`}
            value={itemInputs[item.item_id]?.sticks ?? "0"}
            editable={true}
            error={isInvalidSticks(item.item_id)}
            onChangeText={text => {
              const sticksNum = Number(text) || 0;
              const perPkt = Number(item.sticks_per_packet) || 0;
              const packetCalc = perPkt > 0 ? Math.floor(sticksNum / perPkt).toString() : "";
              setItemInputs(prev => ({
                ...prev,
                [item.item_id]: { ...(prev[item.item_id] || {}), sticks: text, packets: packetCalc },
              }));
            }}
            keyboardType="numeric"
            style={[styles.input, styles.inputFlex]}
          />
        </View>
        <Divider style={styles.divider} />
        {/* <IconButton
          
          icon="trash-can-outline"
          iconColor={theme.colors.error}
          size={20}
          onPress={() => removeItem(item.item_id)}
        /> */}
        <ButtonPaper
          mode="text"
          textColor="red"
          icon="trash-can"
          onPress={() => confirmRemove(item.item_id)}
        // style={styles.removeBtn}
        >
          Remove
        </ButtonPaper>
      </View>
    </View>
  );

  const removeItem = (itemId: number) => {
    // actual removal logic

    setFilteredItems(prev => prev.filter(i => i.item_id !== itemId));
    setAllItems(prev => prev.filter(i => i.item_id !== itemId));
    setItemInputs(prev => {
      const newInputs = { ...prev };
      delete newInputs[itemId];
      return newInputs;
    });
  };

  const confirmRemove = (itemId: number) => {
    Alert.alert(
      "Confirm removal",
      "Are you sure you want to remove this item?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "OK", onPress: () => removeItem(itemId) }
      ]
    );
  };


return (
  <SafeAreaView style={[{ backgroundColor: theme.colors.primary, height: "100%" }]}>
    <View style={{ flex: 1, padding: 20 }}>
      <Text variant="headlineMedium" style={{ color: "#FFFFFF", marginBottom: 20 }}>
        Push Stock
      </Text>
      {/* No customer selector – using logged‑in user */}
      <View style={{ marginBottom: 10 }}>
        <Searchbar placeholder="Search items" onChangeText={onChangeSearch} value={searchQuery} style={{ marginBottom: 10 }} />
      </View>
      {loadingItems ? (
        <ActivityIndicator animating={true} size="large" color="#FFFFFF" />
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={item => item.item_id?.toString()}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={() => <View style={{ height: 80 }} />}
        />
      )}
      {/* Floating Submit button */}
      <View style={[styles.submitButtonContainer, { position: "absolute", bottom: 20, alignSelf: "center", marginTop: 0 }]}>
        <ButtonPaper
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          disabled={submitting || !Object.values(itemInputs).some(v => Number(v.sticks) > 0) || Object.values(itemInputs).some(v => Number(v.sticks) < 0)}
        >
          {submitting ? <ActivityIndicator animating={true} size="small" color="white" /> : "Push"}
        </ButtonPaper>
      </View>
    </View>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  input: { marginBottom: 10, backgroundColor: "#f5f5f5", borderRadius: 4, height: 48, fontSize: 16, paddingHorizontal: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  inputFlex: { maxWidth: '100%', marginHorizontal: 10 },
  divider: { height: 1, backgroundColor: '#ccc', marginVertical: 8 },

  card: { width: "95%", marginHorizontal: "3%", marginVertical: 15, backgroundColor: "#fff", borderRadius: 8, overflow: "hidden", elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, minHeight: 150, justifyContent: "center", alignItems: "center", paddingHorizontal: 10 },
  image: { width: "100%", height: 100, resizeMode: "contain" },
  info: { padding: 8 },
  title: { fontWeight: "bold", fontSize: 14 },
  subtitle: { fontSize: 12, color: "#666" },
  dropdown: { marginBottom: 15, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 8, height: 50 },
  dropdownContainer: { marginBottom: 20 },
  placeholderStyle: { color: "#888" },
  selectedTextStyle: { color: "#000" },
  submitButtonContainer: { marginTop: 20, alignItems: "center" },
  submitButton: { width: 200 },
});
