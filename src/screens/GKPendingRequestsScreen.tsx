import { View, ScrollView, StyleSheet, Modal } from "react-native";
import React, { useEffect, useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Card, Checkbox, TextInput, ProgressBar, ActivityIndicator, RadioButton, Button } from "react-native-paper";
import { Alert } from "react-native";
import { usePaperColorScheme } from "../theme/theme";
import ButtonPaper from "../components/ButtonPaper";
import { loginStorage } from "../storage/appStorage";
import { LoginDataMessage } from "../models/api_types";
import useGKInventory from "../hooks/api/useGKInventory";
import useCategoryItems from "../hooks/api/useCategoryItems";
import { useIsFocused } from "@react-navigation/native";
import GKHeader from "../components/GKHeader";
import { Image } from "react-native";
import { BASE_URL_ITEM_IMG } from "../config/config";
import { useRoute } from '@react-navigation/native';
export default function GKPendingRequestsScreen() {
  const theme = usePaperColorScheme();
  const isFocused = useIsFocused();
  const { fetchPendingRequests, issueStock, userId } = useGKInventory();
  const loginData = JSON.parse(loginStorage.getString("login-data") || "{}") as LoginDataMessage;
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const route = useRoute();
  const { type } = route.params ?? {};
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedReqForAdd, setSelectedReqForAdd] = useState<number | null>(null);


  const [itemState, setItemState] = useState<{
    [key: string]: {
      approved_packet: string;
      fetched_packet: number;
      fetched_total_sticks: number;
      isChecked: boolean;
    };
  }>({});
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selectedQuantities, setSelectedQuantities] = useState<{ [key: number]: string }>({});
  const [requestType, setRequestType] = useState<string>(type ? type.toUpperCase() : 'ISSUE');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const filter = requestType;

  const loadRequests = () => {
    setLoading(true);
    fetchPendingRequests()
      .then(res => {
        console.log(res.data);
        if (res.status === 1) {
          setRequests(res.data);
          const init: any = {};
          res.data.forEach((req: any) => {
            req.items?.forEach((it: any) => {
              const key = `${req.request_id}-${it.item_id}`;
              init[key] = {
                approved_packet: String(it.requested_packet),
                fetched_packet: it.requested_packet,
                fetched_total_sticks: it.requested_total_sticks,
                isChecked: false,
                approved_sticks: String(it.requested_total_sticks),
              };
            });
          });
          setItemState(init);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isFocused) loadRequests();
  }, [isFocused]);

  // Fetch all products when the modal opens
  useEffect(() => {
    if (addModalVisible) {
      const fetchAll = async () => {
        try {
          const creds = {
            comp_id: loginData?.comp_id,
            br_id: loginData?.br_id,
            catg_id: 0,
            user_id: loginData?.user_id,
          };
          const res = await useCategoryItems().fetchCategoryItems(creds);
          setAllProducts(res?.msg ?? []);
        } catch (e) {
          console.error('Failed to fetch products', e);
        }
      };
      fetchAll();
    }
  }, [addModalVisible]);

  const toggleItem = (key: string) => {
    setItemState(prev => ({
      ...prev,
      [key]: { ...prev[key], isChecked: !prev[key].isChecked },
    }));
  };

  // Check all items for a given request ID
  const checkAll = (reqId: number) => {
    setItemState(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(k => {
        if (k.startsWith(`${reqId}-`)) {
          updated[k] = { ...updated[k], isChecked: true };
        }
      });
      return updated;
    });
  };
  // Remove an item from the pending list
  const removeItem = (key: string) => {
    setItemState(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };



  const handleApproveRequest = (reqId: number) => {
    const selected = Object.entries(itemState)
      .filter(([key, val]) => key.startsWith(`${reqId}-`) && val.isChecked)
      .map(([key, val]) => {
        const [, itemIdStr] = key.split("-");
        const itemId = Number(itemIdStr);
        const packet = Number(val.approved_packet) || 0;
        const sticks = Number(val.approved_sticks) || 0;
        return {
          item_id: itemId,
          fulfilled_packet: packet,
          fulfilled_total_sticks: sticks,
        };
      });

    if (selected.length === 0) {
      Alert.alert("Please select at least one item to approve.");
      return;
    }

    Alert.alert(
      "Confirm Approval",
      "Are you sure you want to approve the selected items?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: () => {
            issueStock({
              request_id: reqId,
              fulfilled_by: userId,
              items: selected,
            })
              .then(() => {
                Alert.alert("Issued successfully!");
                loadRequests();
              })
              .catch(err => Alert.alert("Error: " + err?.message));
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Add selected items from modal to the request state
  const addSelectedItems = () => {
    if (!selectedReqForAdd) return;
    const updates: any = {};
    Object.entries(selectedQuantities).forEach(([idStr, qtyStr]) => {
      const qty = Number(qtyStr);
      if (qty > 0) {
        const itemId = Number(idStr);
        const key = `${selectedReqForAdd}-${itemId}`;
        const product = allProducts.find(p => p.item_id === itemId) || {};
        updates[key] = {
          approved_packet: qtyStr,
          fetched_packet: qty,
          fetched_total_sticks: product.requested_total_sticks || 0,
          isChecked: false,
          approved_sticks: String(product.requested_total_sticks || 0),
        };
      }
    });
    if (Object.keys(updates).length > 0) {
      setItemState(prev => ({ ...prev, ...updates }));
    }
    // reset modal state
    setAddModalVisible(false);
    setSelectedQuantities({});
    setSelectedReqForAdd(null);
  };

  const onQuantityChange = (itemId: number, text: string) => {
    setSelectedQuantities(prev => ({ ...prev, [itemId]: text }));
  };

  // Placeholder - will be replaced by memoized calculation

  const groupedByUser = {} as Record<string, { user_name: string; dates: Record<string, number[]> }>;
  requests?.filter(req => req.request_type === requestType).forEach(req => {
    const userId = req.user_id?.toString() || 'unknown';
    const userName = req.user_name || 'Unknown User';
    const dateStr = new Date(req.request_date).toLocaleDateString();
    if (!groupedByUser[userId]) {
      groupedByUser[userId] = { user_name: userName, dates: {} };
    }
    if (!groupedByUser[userId].dates[dateStr]) {
      groupedByUser[userId].dates[dateStr] = [];
    }
    groupedByUser[userId].dates[dateStr].push(req.request_id);
  });

  // Calculate progress based on visible subset (expanded user/date)
  const progress = (() => {
    // When a specific date is expanded under a user
    if (expandedDate && expandedUser) {
      const reqIds = groupedByUser[expandedUser]?.dates[expandedDate] ?? [];
      const keys = reqIds.flatMap(id => Object.keys(itemState).filter(k => k.startsWith(`${id}-`)));
      const total = keys.length;
      const checked = keys.filter(k => itemState[k].isChecked).length;
      return total > 0 ? checked / total : 0;
    }
    // When only a user is expanded (showing dates)
    if (expandedUser) {
      const allReqIds = Object.values(groupedByUser[expandedUser].dates).flat();
      const keys = allReqIds.flatMap(id => Object.keys(itemState).filter(k => k.startsWith(`${id}-`)));
      const total = keys.length;
      const checked = keys.filter(k => itemState[k].isChecked).length;
      return total > 0 ? checked / total : 0;
    }
    // No specific subset – fall back to overall progress
    const total = Object.keys(itemState).length;
    const checked = Object.values(itemState).filter(v => v.isChecked).length;
    return total > 0 ? checked / total : 0;
  })();
  return (
    <SafeAreaView style={[{ backgroundColor: theme.colors.primary, height: "100%" }]} >
      <ProgressBar progress={progress} color={theme.colors.secondary} style={{ height: 8 }} />
      <GKHeader title="Pending Requests" />
      {loading && <ActivityIndicator size="large" color="white" style={{ marginTop: 20 }} />}
      <ScrollView>
        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
            {expandedUser ? (
              <View >

                {Object.entries(groupedByUser[expandedUser].dates).map(([dateStr, reqIds]) => (
                  <ButtonPaper
                    key={dateStr}
                    mode="text"
                    style={{ backgroundColor: 'white', marginBottom: 10 }}
                    onPress={() => setExpandedDate(dateStr)}
                  >
                    {dateStr} ({reqIds.length})
                  </ButtonPaper>
                ))}
              </View>
            ) : (
              Object.entries(groupedByUser).map(([userId, data]) => (
                <View >
                  <Card key={userId} style={{ height: 110, width: 180 }}>
                    <Card.Title titleStyle={{ fontStyle: 'normal' }} title={data.user_name} />
                    <Card.Content>
                      <ButtonPaper mode="contained" onPress={() => setExpandedUser(userId)}>
                        View Dates ({Object.keys(data.dates).length})
                      </ButtonPaper>
                    </Card.Content>
                  </Card>
                </View>
              )))
            }
          </View>
          {expandedDate && (
            <View>
              {requests
                .filter(req => {
                  const userMatch = req.user_id?.toString() === expandedUser;
                  const dateMatch = new Date(req.request_date).toLocaleDateString() === expandedDate;
                  const typeMatch = req.request_type === requestType;
                  return userMatch && dateMatch && typeMatch;
                })
                .map((req: any, i: number) => (
                  <Card key={i} style={[styles.card, Object.keys(itemState).filter(k => k.startsWith(`${req.request_id}-`)).every(k => itemState[k].isChecked) && styles.cardChecked]}>
                    <Card.Title title={`Request #${req.request_id}`} />
                    <Card.Content>

                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <ButtonPaper
                          mode="text"
                          onPress={() => {
                            const allChecked = (() => {
                              const keys = Object.keys(itemState).filter(k => k.startsWith(`${req.request_id}-`));
                              return keys.length > 0 && keys.every(k => itemState[k].isChecked);
                            })();
                            if (allChecked) {
                              setItemState(prev => {
                                const updated = { ...prev };
                                Object.keys(updated).forEach(k => {
                                  if (k.startsWith(`${req.request_id}-`)) {
                                    updated[k] = { ...updated[k], isChecked: false };
                                  }
                                });
                                return updated;
                              });
                            } else {
                              checkAll(req.request_id);
                            }
                          }}
                          style={styles.editBtn}
                          textColor="blue"
                        >
                          {(() => {
                            const keys = Object.keys(itemState).filter(k => k.startsWith(`${req.request_id}-`));
                            const allChecked = keys.length > 0 && keys.every(k => itemState[k].isChecked);
                            return allChecked ? 'Uncheck All' : 'Check All';
                          })()}
                        </ButtonPaper>
                      </View>
                      {req.items?.map((item: any, j: number) => {
                        const key = `${req.request_id}-${item.item_id}`;
                        const state = itemState[key];
                        if (!state) return null;
                        return (
                          <View key={j}>
                            <View style={styles.itemRow}>
                              <Checkbox
                                status={state.isChecked ? "checked" : "unchecked"}
                                onPress={() => toggleItem(key)}
                              />
                              <View style={styles.itemInfo}>
                                <Image source={{ uri: BASE_URL_ITEM_IMG + item.item_img }} style={{ width: '100%', height: 100, resizeMode: "contain", marginRight: 15 }} />
                                <Text variant="bodyMedium">{item.item_name}</Text>
                                <Text variant="bodySmall">
                                  Requested: {item.requested_packet} Pkts, {item.requested_total_sticks} Sticks
                                </Text>
                                {editingKey === key ? (
                                  <View style={styles.editContainer}>
                                    <TextInput
                                      mode="outlined"
                                      label="Edit Sticks"
                                      value={state.approved_sticks.toString()}
                                      onChangeText={text => onSticksChange(key, text)}
                                      keyboardType="numeric"
                                      style={{ flex: 1, marginRight: 8 }}
                                    />
                                    <ButtonPaper
                                      mode="text"
                                      onPress={() => setEditingKey(null)}
                                      style={styles.editBtn}
                                      textColor="blue"
                                    >
                                      Save
                                    </ButtonPaper>
                                    <ButtonPaper
                                      mode="text"
                                      textColor="red"
                                      icon="trash-can"
                                      onPress={() => removeItem(key)}
                                      style={styles.removeBtn}
                                    >
                                      Remove
                                    </ButtonPaper>
                                  </View>
                                ) : (
                                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <View>
                                      <Text variant="bodySmall" style={{ marginRight: 8 }}>Approved: {state.approved_packet}</Text>
                                      <Text variant="bodySmall" style={{ color: '#aaa' }}>Requested: {item.requested_packet}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row' }}>
                                      <ButtonPaper
                                        mode="text"
                                        onPress={() => setEditingKey(key)}
                                      >
                                        Edit
                                      </ButtonPaper>
                                    </View>
                                  </View>
                                )}
                              </View>
                            </View>
                            <View style={styles.divider} />
                            {/* <ButtonPaper mode="contained" onPress={() => handleApproveRequest(req.request_id)} style={styles.approveBtn}>
                              Final Approve
                            </ButtonPaper> */}
                          </View>

                        );
                      })}
                      <ButtonPaper mode="contained" onPress={() => handleApproveRequest(req.request_id)} style={styles.approveBtn}>Final Approve</ButtonPaper>
                    </Card.Content>
                  </Card>
                ))}
            </View>
          )}




          {/* </Card.Content>
      </Card> */}
          {/* ))
          )} */}
          {requests?.length === 0 && (
            <Text variant="bodyMedium" style={{ color: "white", textAlign: "center", marginTop: 20 }}>
              No pending requests.
            </Text>
          )}
        </View>
      </ScrollView >
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 15 },
  cardChecked: { borderColor: 'green', borderWidth: 4 },
  itemRow: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  itemInfo: { flex: 1, marginLeft: 8 },
  input: { marginTop: 8, backgroundColor: "#f5f5f5" },
  approveBtn: { marginTop: 12 },
  divider: { height: 1, backgroundColor: "#555", marginVertical: 8 },
  removeBtn: { marginTop: 4 },
  editBtn: { marginTop: 4 },
  editContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { margin: 20, padding: 20, backgroundColor: '#fff', borderRadius: 10, maxHeight: '80%' },
  modalItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  modalImage: { width: 50, height: 50, marginRight: 10 },
  modalInput: { width: 80 },
  modalAddBtn: { marginTop: 10 },
  modalCancelBtn: { marginTop: 5 }
});
