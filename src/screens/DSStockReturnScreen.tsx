import { View, ScrollView, StyleSheet, FlatList, Image, Alert, TouchableOpacity } from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, TextInput, Searchbar, Checkbox, Menu, Button, ActivityIndicator, Divider } from "react-native-paper";
import { usePaperColorScheme } from "../theme/theme";
import ButtonPaper from "../components/ButtonPaper";
import useDSInventory from "../hooks/api/useDSInventory";
import { loginStorage } from "../storage/appStorage";
import { useRoute } from "@react-navigation/native";
import { BASE_URL_ITEM_IMG } from "../config/config";

export default function DSStockReturnScreen() {
  const theme = usePaperColorScheme();
  const route = useRoute();
  const { claimType: paramClaim } = (route.params as any) || {};
  useEffect(() => {
    if (paramClaim) {
      setClaimType(paramClaim);
    }
  }, [paramClaim]);

  const { fetchLastApprovedRequests, returnStock } = useDSInventory();
  const [loading, setLoading] = useState(true);
  // const { fetchCategoryItems } = useCategoryItems(); // no longer needed
  const [allItems, setAllItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  type ItemState = {
    packets: string; // user entered packet count
    sticks: string; // calculated sticks
    isChecked: boolean;
  };
  const [itemState, setItemState] = useState<Record<string, ItemState>>({});
  const [claimType, setClaimType] = useState<any>("DAMAGE");
  const [showClaimMenu, setShowClaimMenu] = useState(false);
  const [remarks, setRemarks] = useState("");

  // Load items on mount - fetch last approved request list
  useEffect(() => {
    const loginData = JSON.parse(loginStorage.getString("login-data") || "{}");
    const compId = loginData.comp_id;
    const brId = loginData.br_id;
    if (compId && brId) {
      fetchLastApprovedRequests({ user_id: loginData.user_id, comp_id: compId, br_id: brId })
        .then(data => {
          const items = data?.data?.items || [];
          console.log(items);
          setAllItems(items);
          setFilteredItems(items);
          const init: Record<string, ItemState> = {};
          items.forEach((it: any) => {
            const key = `${it.item_id}`;
            init[key] = {
              packets: "",
              sticks: "",
              isChecked: false,
            };
          });
          setItemState(init);
        })
        .catch(err => console.error("Failed to fetch last approved requests", err))
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
    const filtered = allItems.filter(item =>
      (item.item_name && item.item_name.toLowerCase().includes(lower)) ||
      (item.item_id && item.item_id.toString().includes(lower))
    );
    setFilteredItems(filtered);
  };

  const onPacketChange = (key: string, text: string) => {
    setItemState(prev => {
      const cur = prev[key] || {
        packets: "",
        sticks: "",
        isChecked: false,
      };
      const num = Number(text) || 0;
      const item = allItems.find(it => `${it.item_id}` === key);
      const sticksPerPkt = item?.sticks_per_packet || 0;
      const newSticks = Math.round(num / sticksPerPkt);
      return {
        ...prev,
        [key]: {
          ...cur,
          // packets: text,
          packets: newSticks.toString(),
          sticks: text,
          isChecked: true, // auto-check when modified
        },
      };
    });
  };

  const toggleItem = (key: string) => {
    setItemState(prev => ({
      ...prev,
      [key]: { ...prev[key], isChecked: !prev[key].isChecked },
    }));
  };

  const handleSubmit = () => {
    const loginData = JSON.parse(loginStorage.getString("login-data") || "{}");
    const selected = Object.entries(itemState)
      .filter(([k, v]) => v.isChecked && Number(v.sticks) > 0)
      .map(([k, v]) => ({
        item_id: Number(k),
        packet: Number(v.packets),
        total_sticks: Number(v.sticks),
      }));
    if (selected.length === 0) {
      Alert.alert("Select at least one item and specify sticks greater than 0.");
      return;
    }
    const payload = {
      comp_id: loginData.comp_id,
      br_id: loginData.br_id,
      user_id: loginData.user_id,
      items: selected,
      return_flag: paramClaim[0],

    };
    returnStock(payload)
      .then(() => {
        Alert.alert("Returned / Claimed successfully!");
        // Reset state
        setItemState(prev => {
          const reset: any = {};
          Object.keys(prev).forEach(k => {
            reset[k] = { packets: "", sticks: "", isChecked: false };
          });
          return reset;
        });
        setClaimType("DAMAGE");
        setRemarks("");
        setSearchQuery("");
        setFilteredItems(allItems);
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
            setAllItems(prev => prev.filter(it => it.item_id !== itemId));
            setFilteredItems(prev => prev.filter(it => it.item_id !== itemId));
            setItemState(prev => {
              const newState = { ...prev };
              delete newState[`${itemId}`];
              return newState;
            });
          },
        },
      ],
      { cancelable: true }
    );
  };

  const hasInvalidInput = Object.entries(itemState).some(([k, v]) => {
    const sticksNum = Number(v.sticks) || 0;
    if (sticksNum === 0) return false;
    if (sticksNum < 0) return true;
    const item = allItems.find(it => `${it.item_id}` === k);
    const perPkt = item ? (Number(item.sticks_per_packet) || 0) : 0;
    const isExceedingStock = sticksNum > (item?.curr_total_sticks || 0);
    const isNotMultiple = perPkt > 0 && sticksNum % perPkt !== 0;
    return isExceedingStock || isNotMultiple;
  });

  const renderItem = ({ item }: { item: any }) => {
    const key = `${item.item_id}`;
    // Fallback ensures we always have the fields the UI expects
    const state = itemState[key] || { packets: "", sticks: "", isChecked: false };

    const sticksNum = Number(state.sticks) || 0;
    const perPkt = Number(item.sticks_per_packet) || 0;
    const isExceedingStock = sticksNum > (item.curr_total_sticks || 0);
    const isNotMultiple = sticksNum > 0 && perPkt > 0 && sticksNum % perPkt !== 0;
    const isInvalid = isExceedingStock || isNotMultiple || sticksNum < 0;

    return (
      <View style={styles.card}>
        {item?.item_img ? (
          <Image
            source={{ uri: BASE_URL_ITEM_IMG + item?.item_img }}
            style={styles.cardImage}
          />
        ) : null}

        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
            {item.item_name} <Text style={styles.sticksCount}>(Sticks: {item.curr_total_sticks ?? 0})</Text>
          </Text>

          <View style={styles.divider} />

          <View style={styles.inputRow}>
            <Checkbox.Android
              status={state.isChecked ? 'checked' : 'unchecked'}
              onPress={() => toggleItem(key)}
            />
            <TextInput
              mode="outlined"
              label="Sticks"
              value={state.sticks}
              editable={true}
              error={isInvalid}
              keyboardType="numeric"
              onChangeText={text => onPacketChange(key, text)}
              style={styles.inputSmall}
            />
          </View>
          {isInvalid && (
            <Text style={styles.errorText}>
              {sticksNum < 0
                ? "Sticks cannot be negative"
                : isExceedingStock
                  ? "Exceeds available stock"
                  : `Must be a multiple of ${perPkt} sticks`}
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
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={item => `${item.item_id}`}
        extraData={itemState}
        contentContainerStyle={{ alignItems: 'center' }}
        ListHeaderComponent={
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text variant="headlineMedium" style={{ color: "#FFFFFF", marginBottom: 20 }}>Return / Claim Stock</Text>
            <Searchbar placeholder="Search items" onChangeText={onChangeSearch} value={searchQuery} style={{ marginBottom: 10, width: 300 }} />
            <View style={styles.inputRow}>
              <Button mode="contained" buttonColor={theme.colors.primary} textColor="#FFFFFF" onPress={() => setShowClaimMenu(true)} style={styles.dropdownButton}>{claimType}</Button>
              <Menu visible={showClaimMenu} onDismiss={() => setShowClaimMenu(false)} anchor={<View />}>
                {['DAMAGE', 'THEFT', 'RETURN'].map(opt => (
                  <Menu.Item key={opt} title={opt} onPress={() => { setClaimType(opt); setShowClaimMenu(false); }} />
                ))}
              </Menu>
            </View>
            <TextInput
              mode="outlined"
              label="Remarks (Optional)"
              value={remarks}
              onChangeText={setRemarks}
              style={styles.remarksInput}
              multiline
              numberOfLines={3}
              textColor="#FFFFFF"
              outlineColor="#FFFFFF"
              activeOutlineColor="#FFFFFF"
              theme={{ colors: { onSurfaceVariant: '#FFFFFF', primary: '#FFFFFF', text: '#FFFFFF' } }}
            />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator animating={true} size="large" color="#FFFFFF" style={{ marginTop: 20 }} />
          ) : (
            <Text style={{ marginTop: 20 }}>No items to display.</Text>
          )
        }
      />
      <View style={styles.submitButtonContainer}>
        <ButtonPaper
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          disabled={!Object.values(itemState).some(v => Number(v.sticks) > 0) || hasInvalidInput}
        >
          Submit Return
        </ButtonPaper>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 400,
    marginVertical: 8,
    marginHorizontal: '1%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignSelf: 'center',
    paddingBottom: 12,
    paddingHorizontal: 10
  },
  cardImage: {
    width: '100%',
    height: 60,
    resizeMode: 'cover',
    marginVertical: 10
  },
  cardContent: {
    padding: 12,
    alignItems: 'stretch',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0052cc',
  },
  sticksCount: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#555',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
    width: '100%',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  inputSmall: {
    flex: 1,
    height: 48,
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  removeText: {
    color: 'red',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dropdownButton: {
    width: 120,
    marginRight: 8,
    borderRadius: 8,
  },
  remarksInput: {
    width: 300,
    backgroundColor: 'transparent',
    borderRadius: 4,
    height: 80,
    fontSize: 16,
    paddingHorizontal: 12,
    marginVertical: 10,
    color: '#FFFFFF',
  },
  submitButtonContainer: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  submitButton: {
    width: 200,
  },
});
