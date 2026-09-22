// Push Stock screen redesigned to mirror Stock Return UI
import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, FlatList, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, TextInput, Searchbar, ActivityIndicator, Divider, Button } from "react-native-paper";
import { usePaperColorScheme } from "../theme/theme";
import ButtonPaper from "../components/ButtonPaper";
import useGKInventory from "../hooks/api/useGKInventory";
import { loginStorage } from "../storage/appStorage";
import axios from "axios";
import { ADDRESSES } from "../config/api_list";
import useCategoryItems from "../hooks/api/useCategoryItems";
import { Dropdown } from "react-native-element-dropdown";
import { BASE_URL_ITEM_IMG } from "../config/config";
import GKHeader from "../components/GKHeader";

export default function GKPurchaseStockScreen() {
  const theme = usePaperColorScheme();
  const { pushIssueStock, purchaseStock, userId } = useGKInventory();
  const { fetchCategoryItems } = useCategoryItems();

  // Customer dropdown state
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [itemInputs, setItemInputs] = useState<Record<string, { packets: string; sticks: string }>>({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loginStr = loginStorage.getString("login-data") || "{}";
    const loginData = JSON.parse(loginStr);
    const creds = { comp_id: loginData.comp_id || 0, br_id: loginData.br_id || 0 };
    axios.post(ADDRESSES.GET_DS_LIST, creds)
      .then(res => {
        const data = res?.data;
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (data && Array.isArray(data.list)) list = data.list;
        else if (data && Array.isArray(data.data)) list = data.data;
        else if (data && Array.isArray(data.msg)) list = data.msg;
        setCustomers(list);
      })
      .catch(err => Alert.alert("Error fetching DS users", err?.message))
      .finally(() => setLoadingCustomers(false));
  }, []);

  useEffect(() => {
    const loginStr = loginStorage.getString("login-data") || "{}";
    const loginData = JSON.parse(loginStr);
    const compId = loginData.comp_id;
    const brId = loginData.br_id;
    if (compId && brId) {
      fetchCategoryItems({ comp_id: compId, br_id: brId, catg_id: 0, user_id: loginData.user_id })
        .then(data => {
          const items = data?.msg || [];
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
      user_id: selectedCustomer,
      fulfilled_by: userId,
      items: itemsPayload,
    })
      .then(() => {
        Alert.alert("Stock pushed successfully!");
        setItemInputs({});
        setSelectedCustomer(null);
      })
      .catch(err => Alert.alert("Error: " + err?.message))
      .finally(() => setSubmitting(false));
  };
  const removeItem = (itemId: number) => {
    Alert.alert(
      "Confirm Removal",
      "Are you sure you want to remove this item?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setAllItems(prev => prev.filter(i => i.item_id !== itemId));
            setFilteredItems(prev => prev.filter(i => i.item_id !== itemId));
            setItemInputs(prev => {
              const newInputs = { ...prev };
              delete newInputs[itemId];
              return newInputs;
            });
          },
        },
      ],
      { cancelable: true }
    );
  };
  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      {item.item_img ? <Image source={{ uri: BASE_URL_ITEM_IMG + item.item_img }} style={styles.image} /> : null}
      <View style={styles.info}>
        <Text style={styles.title}>{item.item_name}</Text>
        <Text style={styles.subtitle}>ID: {item.item_id}</Text>
        <View style={styles.inputRow}>
          {/* Packets input (disabled) */}
          {/* <TextInput
            mode="outlined"
            label="Packets"
            value={itemInputs[item.item_id]?.packets ?? ""}
            editable={false}
            keyboardType="numeric"
            style={[styles.input, styles.inputFlex]}
          /> */}
          {/* Sticks input (editable) */}
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
        <Divider style={{ marginVertical: 10 }} />
        <Button
          icon="trash-can-outline"
          mode="text"
          textColor={theme.colors.error}
          onPress={() => removeItem(item.item_id)}
        >
          Remove
        </Button>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[{ backgroundColor: theme.colors.primary, height: "100%" }]}>
      <GKHeader title="Push Stock" />
      <View style={{ flex: 1, padding: 20 }}>
        {loadingCustomers ? (
          <ActivityIndicator animating={true} size="large" color="white" />
        ) : (
          <Dropdown
            data={(customers || []).map(c => {
              const name = c.user_name || c.cust_name || "Users";
              const val = c.user_id || c.id || c.cust_id?.toString();
              return {
                label: val ? `${name} - ${val}` : name,
                value: val,
              };
            })}
            labelField="label"
            valueField="value"
            placeholder="Select User"
            searchPlaceholder="Search Users..."
            value={selectedCustomer}
            onChange={item => setSelectedCustomer(item.value)}
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            containerStyle={styles.dropdownContainer}
          />
        )}
        <View style={{ marginBottom: 10 }}>
          <Searchbar placeholder="Search items" onChangeText={onChangeSearch} value={searchQuery} style={{ marginBottom: 10 }} />
        </View>
        {loadingItems ? (
          <ActivityIndicator animating={true} size="large" color="white" />
        ) : (
          <FlatList
            data={filteredItems}
            renderItem={renderItem}
            keyExtractor={item => item.item_id?.toString()}
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={() => <View style={{ height: 80 }} />}
          />
        )}
        <View style={[styles.submitButtonContainer, { position: "absolute", bottom: 20, alignSelf: "center", marginTop: 0 }]}>
          <ButtonPaper
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            disabled={submitting || !selectedCustomer || !Object.values(itemInputs).some(v => Number(v.sticks) > 0) || Object.values(itemInputs).some(v => Number(v.sticks) < 0)}
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
  inputFlex: { flex: 1, maxWidth: '100%', marginHorizontal: 10 },
  inputRow: { width: '100%', flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 10 },
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
