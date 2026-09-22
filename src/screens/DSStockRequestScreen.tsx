import { View, ScrollView, StyleSheet, FlatList, Image, Alert } from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, TextInput, Searchbar, ActivityIndicator, Divider, Button } from "react-native-paper";
import { usePaperColorScheme } from "../theme/theme";
import { IconButton } from "react-native-paper";
import ButtonPaper from "../components/ButtonPaper";
import useDSInventory from "../hooks/api/useDSInventory";
import useCategoryItems from "../hooks/api/useCategoryItems";
import { loginStorage } from "../storage/appStorage";
import { BASE_URL_ITEM_IMG } from "../config/config";

export default function DSStockRequestScreen() {
  const theme = usePaperColorScheme();
  const { requestStock, userId } = useDSInventory();
  const [loading, setLoading] = useState(true);
  const { fetchCategoryItems } = useCategoryItems();
  const [itemInputs, setItemInputs] = useState<Record<string, { packets?: string; sticks?: string }>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  // Load items on mount using CATEGORY_ITEM_LIST
  useEffect(() => {
    const loginData = JSON.parse(loginStorage.getString("login-data") || "{}");
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
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
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



  const handleSubmit = () => {
    const loginData = JSON.parse(loginStorage.getString("login-data") || "{}");
    const itemsPayload = Object.entries(itemInputs)
      .filter(([, inputs]) => inputs && (inputs.packets || inputs.sticks))
      .map(([itemId, inputs]) => ({
        item_id: Number(itemId),
        packet: Number(inputs.packets) || 0,
        total_sticks: Number(inputs.sticks) || 0,
      }));
    requestStock({
      comp_id: loginData.comp_id || 1,
      br_id: loginData.br_id || 1,
      user_id: userId,
      items: itemsPayload,
    })
      .then(() => {
        Alert.alert("Request sent successfully!");
        setItemInputs({});
      })
      .catch(err => Alert.alert("Error: " + err?.message));
    };

    const handleDelete = (itemId: number) => {
      Alert.alert(
        "Confirm Removal",
        "Are you sure you want to remove this item?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => {
              setAllItems(prev => prev.filter(item => item.item_id !== itemId));
              setFilteredItems(prev => prev.filter(item => item.item_id !== itemId));
              setItemInputs(prev => {
                const newPrev = { ...prev };
                delete newPrev[itemId];
                return newPrev;
              });
            },
          },
        ],
        { cancelable: true }
      );
    };

  const hasInvalidInput = Object.entries(itemInputs).some(([itemId, v]) => {
    const sticksNum = Number(v.sticks) || 0;
    if (sticksNum === 0) return false;
    if (sticksNum < 0) return true;
    const item = allItems.find((i: any) => i.item_id === Number(itemId));
    const perPkt = item ? (Number(item.sticks_per_packet) || 0) : 0;
    return perPkt > 0 && sticksNum % perPkt !== 0;
  });

  const renderItem = ({ item }: { item: any }) => {
    const currentInput = itemInputs[item.item_id];
    const sticksNum = Number(currentInput?.sticks) || 0;
    const perPkt = Number(item.sticks_per_packet) || 0;
    const isInvalid = (sticksNum > 0 && perPkt > 0 && sticksNum % perPkt !== 0) || sticksNum < 0;

    return (
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
              value={itemInputs[item.item_id]?.packets ?? ''}
              editable={false}
              keyboardType="numeric"
              style={[styles.input, styles.inputFlex]}
            /> */}
            {/* Sticks input (editable) */}
            <TextInput
              mode="outlined"
              label="Sticks"
              value={itemInputs[item.item_id]?.sticks ?? '0'}
              editable={true}
              error={isInvalid}
              onChangeText={text => {
                const sticksNum = Number(text) || 0;
                const perPkt = Number(item.sticks_per_packet) || 0;
                const packetCalc = perPkt > 0 ? Math.floor(sticksNum / perPkt).toString() : '';
                setItemInputs(prev => ({
                  ...prev,
                  [item.item_id]: { ...(prev[item.item_id] || {}), sticks: text, packets: packetCalc },
                }));
              }}
              keyboardType="numeric"
              style={[styles.input, styles.inputFlex]}
            />
          </View>
          {isInvalid && (
            <Text style={{ color: theme.colors.error, fontSize: 12, marginTop: -5, marginBottom: 10, textAlign: 'center' }}>
              {sticksNum < 0 ? "Sticks cannot be negative" : `Must be a multiple of ${perPkt} sticks`}
            </Text>
          )}
          <Divider style={{ marginVertical: 10 }} />
          <Button
            icon="trash-can-outline"
            mode="text"
            textColor={theme.colors.error}
            onPress={() => handleDelete(item.item_id)}
          >
            Remove
          </Button>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[{ backgroundColor: theme.colors.primary }, { flex: 1 }]}>
      {loading ? (
        <ActivityIndicator animating={true} size="large" color="#FFFFFF" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={item => item.item_id?.toString()}
          ListHeaderComponent={
            <View style={{ padding: 20 }}>
              <Text variant="headlineMedium" style={{ color: "#FFFFFF", marginBottom: 20 }}>
                Request Stock
              </Text>
              <Searchbar
                placeholder="Search items"
                onChangeText={onChangeSearch}
                value={searchQuery}
                style={{ marginBottom: 10 }}
              />
            </View>
          }
        />
      )}
      {/* Floating Submit Button */}
      <View style={styles.submitButtonContainer}>
        <ButtonPaper 
          mode="contained" 
          onPress={handleSubmit} 
          style={styles.submitButton}
          disabled={!Object.values(itemInputs).some(v => Number(v.sticks) > 0) || hasInvalidInput}
        >
          Submit Request
        </ButtonPaper>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input: { marginBottom: 10, backgroundColor: '#f5f5f5', borderRadius: 4, height: 48, fontSize: 16, paddingHorizontal: 12, minWidth: 120 },
  inputFlex: { flex: 1, maxWidth: 220, marginHorizontal: 10 },
  inputRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  card: {
    width: '95%',
    marginHorizontal: '3%',
    marginVertical: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    // optional background for overlay effect
    // backgroundColor: 'rgba(255,255,255,0.8)',
    // paddingVertical: 10,
  },
  deleteButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
  },
  submitButton: {
    width: 200,
    // adjust as needed
  },
  image: { width: "100%", height: 100, resizeMode: "contain" },
  info: { padding: 8 },
  title: { fontWeight: "bold", fontSize: 14 },
  subtitle: { fontSize: 12, color: "#666" },
});
