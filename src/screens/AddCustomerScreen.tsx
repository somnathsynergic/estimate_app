import React, { useState, useContext } from 'react';

import { SafeAreaView, ScrollView, View, StyleSheet, ToastAndroid, Alert, Platform, PermissionsAndroid, FlatList, TouchableOpacity } from 'react-native';

import { CommonActions, useIsFocused, useNavigation } from '@react-navigation/native';
import { Text, useTheme } from 'react-native-paper';
import navigationRoutes from "../routes/navigationRoutes";
import Geolocation from 'react-native-geolocation-service';
import normalize, { SCREEN_HEIGHT, SCREEN_WIDTH } from "react-native-normalize";
import HeaderImage from "../components/HeaderImage";
import { productHeader, productHeaderDark } from "../resources/images";
import InputPaper from "../components/InputPaper";
import ButtonPaper from "../components/ButtonPaper";
import axios from 'axios';
import { loginStorage } from "../storage/appStorage";
import { LoginDataMessage } from "../models/api_types";
import useAddCustomer from "../hooks/api/useAddCustomer";
import { AppStore } from "../context/AppContext";
import { AppStoreContext } from "../models/custom_types";

const AddCustomerScreen = () => {
    const theme = useTheme();
    const navigation = useNavigation();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'add' | 'choose'>('add');
    const [customerSearch, setCustomerSearch] = useState<string>('');

    const { handleGetCustomerList, customerList, setCustomer } = useContext<AppStoreContext>(AppStore);

    const { addCustomer } = useAddCustomer();

    const getAddressFromCoords = async (lat: number, lon: number) => {
        try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`, {
                headers: {
                    'User-Agent': 'EstimateApp/1.0'
                }
            });
            if (response.data && response.data.display_name) {
                setAddress(response.data.display_name);
            }
        } catch (error) {
            console.error("Geocoding error:", error);
        }
    };

    const requestLocationPermission = async () => {
        if (Platform.OS === 'ios') {
            const auth = await Geolocation.requestAuthorization('whenInUse');
            return auth === 'granted';
        }

        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return false;
    };

    const getLocation = async () => {
        setLoadingLocation(true);
        const hasPermission = await requestLocationPermission();

        if (!hasPermission) {
            ToastAndroid.show('Location permission denied', ToastAndroid.SHORT);
            setLoadingLocation(false);
            return;
        }

        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ latitude, longitude });
                getAddressFromCoords(latitude, longitude);
                setLoadingLocation(false);
                ToastAndroid.show('Location and Address captured!', ToastAndroid.SHORT);
            },
            (error) => {
                console.log(error.code, error.message);
                setLoadingLocation(false);
                Alert.alert('Error', 'Could not get location. Make sure GPS is on.');
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };

    const isFocused = useIsFocused();

    React.useEffect(() => {
        if (isFocused) {
            getLocation();
        }
    }, [isFocused]);

    const handleSave = async () => {
        if (!name.trim() || !phone.trim()) {
            Alert.alert('Error', 'Customer Name and Phone Number are mandatory');
            return;
        }

        const loginStore = JSON.parse(loginStorage.getString("login-data") || '{}') as LoginDataMessage;

        const payload = {
            comp_id: loginStore?.comp_id,
            br_id: loginStore?.br_id,
            user_id: loginStore?.user_id,
            cust_name: name,
            phone_no: phone,
            address: address,
            lat: location?.latitude || null,
            long: location?.longitude || null,
            created_by: loginStore?.user_id
        };

        console.log("Saving Customer Data Payload:", payload);

        setIsLoading(true);
        await addCustomer(payload)
            .then(res => {
                console.log("ADD_CUSTOMER_RES:", res);
                if (res?.status === 1) {
                    handleGetCustomerList();
                    Alert.alert("Success", "Customer Added Successfully.", [
                        {
                            text: "OK", onPress: () => {
                                setName('');
                                setPhone('');
                                setAddress('');
                                setLocation(null);
                                navigation.navigate(navigationRoutes.homeScreen as never);
                            }
                        }
                    ]);
                } else {
                    Alert.alert("Fail", res?.data || "Something Went Wrong!");
                }
            })
            .catch(err => {
                const errorDetail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
                Alert.alert("Error", `Failed to add customer: ${errorDetail}`);
                console.error("ADD_CUSTOMER_ERROR:", err.response?.data || err);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

//     return (
//         <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
//             <View style={styles.tabContainer}>
//                 <TouchableOpacity onPress={() => { setActiveTab('add'); }} style={[styles.tabButton, activeTab === 'add' && styles.tabButtonActive]}>
//                     <Text style={[styles.tabText, activeTab === 'add' && styles.tabTextActive]}>Add Customer</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity onPress={() => { setActiveTab('choose'); }} style={[styles.tabButton, activeTab === 'choose' && styles.tabButtonActive]}>
//                     <Text style={[styles.tabText, activeTab === 'choose' && styles.tabTextActive]}>Choose Customer</Text>
//                 </TouchableOpacity>
//             </View>
//             {activeTab === 'add' ? (
//                 <ScrollView keyboardShouldPersistTaps="handled">
//                     <View
//                         style={{
//                             backgroundColor: theme.colors.elevation?.level1 || theme.colors.surface,
//                             marginHorizontal: normalize(20),
//                             marginVertical: SCREEN_HEIGHT * 0.1,
//                             borderRadius: 24,
                            
//                             shadowColor: theme.colors.shadow || "#000",
//                             shadowOffset: { width: 0, height: 6 },
//                             shadowOpacity: 0.12,
//                             shadowRadius: 10,
//                             elevation: 6,
//                             borderWidth: 1,
//                             borderColor: theme.colors.outlineVariant || theme.colors.surfaceVariant,
//                             padding: normalize(16),
//                         }}
//                     >
//                         <Text
//                             variant="titleMedium"
//                             style={{
//                                 color: theme.colors.primary,
//                                 fontWeight: "700",
//                                 marginBottom: normalize(10),
//                             }}
//                         >
//                             Add Customer
//                         </Text>

//                         <View style={styles.inputWrapper}>
//                             <InputPaper
//                                 label="Customer Name"
//                                 value={name}
//                                 onChangeText={(val) => setName(val as string)}
//                                 mode="outlined"
//                                 maxLength={100}
//                                 style={{ backgroundColor: theme.colors.surface }}
//                                 labelStyle={{ fontWeight: '700' }}
//                             />
//                         </View>

//                         <View style={styles.inputWrapper}>
//                             <InputPaper
//                                 label="Phone Number"
//                                 value={phone}
//                                 onChangeText={(val) => setPhone(val as string)}
//                                 keyboardType="phone-pad"
//                                 mode="outlined"
//                                 maxLength={15}
//                                 style={{ backgroundColor: theme.colors.surface }}
//                                 labelStyle={{ fontWeight: '700' }}
//                             />
//                         </View>


//                         <View style={[styles.locationContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
//                             <Text variant="titleMedium" style={{ marginBottom: 5, color: theme.colors.onSurfaceVariant }}>
//                                 Location: {location ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : 'Not Captured'}
//                             </Text>
//                             {address ? (
//                                 <Text variant="bodyMedium" style={{ marginBottom: 15, textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
//                                     Address: {address}
//                                 </Text>
//                             ) : null}
//                             <ButtonPaper
//                                 icon="map-marker-radius"
//                                 mode="contained-tonal"
//                                 onPress={getLocation}
//                                 loading={loadingLocation}
//                                 disabled={loadingLocation}
//                             >
//                                 {location ? 'Recapture Location' : 'Capture Current Location'}
//                             </ButtonPaper>
//                         </View>
//                         <View style={{ marginTop: normalize(10) }}>
//                             <ButtonPaper
//                                 mode="contained"
//                                 buttonColor={theme.colors.primary}
//                                 textColor={theme.colors.onPrimary}
//                                 onPress={handleSave}
//                                 loading={isLoading}
//                                 disabled={isLoading || !name.trim() || !phone.trim() || !location}
//                             >
//                                 Save Customer
//                             </ButtonPaper>
//                         </View>
//                     </View>
                    
//                 </ScrollView>
//             ) : (
//                 <View style={styles.container}>
//                     <View style={styles.searchWrapper}>
//                         <InputPaper
//                             label="Search Customer"
//                             value={customerSearch}
//                             onChangeText={(val) => setCustomerSearch(val as string)}
//                             mode="outlined"
//                         />
//                     </View>

//                     <FlatList
//                         data={(customerList || []).filter((c: any) => {
//                             const q = customerSearch.trim().toLowerCase();
//                             if (!q) return true;
//                             const label = (c?.label ?? '').toString().toLowerCase();
//                             const value = (c?.value ?? '').toString().toLowerCase();
//                             return label.includes(q) || value.includes(q);
//                         })}
//                         keyExtractor={(item) => item.value?.toString() ?? ''}
//                         renderItem={({ item }) => (
//                             <TouchableOpacity
//                                 onPress={() => {
//                                     setCustomer(item);
//                                     navigation.dispatch(
//                                         CommonActions.navigate({
//                                             name: navigationRoutes.bottomNavigationPaper,
//                                             params: {
//                                                 screen: 'Categories',
//                                             },
//                                         }),
//                                     );
//                                 }}
//                             >
//                                 <View style={styles.listItem}>
//                                     <Text style={{ fontWeight: 'bold', fontSize: 20, color: theme.colors.primary }}>{item.label}</Text>
//                                 </View>
//                             </TouchableOpacity>
//                         )}
//                         contentContainerStyle={styles.listContainer}
//                         keyboardShouldPersistTaps="handled"
//                         showsVerticalScrollIndicator={false}
//                     />
//                 </View>
//             )}
//         </SafeAreaView>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         paddingVertical: 20,
//         height: '90%',

//     },
//     inputWrapper: {
//         marginBottom: 15,
//     },
//     locationContainer: {
//         marginVertical: 15,
//         padding: 15,
//         borderRadius: 15,
//         alignItems: 'center',
//     },
//     selectButton: {
//         margin: 15,
//         padding: 12,
//         backgroundColor: '#e0e0e0',
//         borderRadius: 8,
//         alignItems: 'center',
//     },
//     selectButtonText: {
//         fontSize: 16,
//         color: '#333',
//     },
//     modalContainer: {
//         backgroundColor: 'white',
//         padding: 20,
//         margin: 20,
//         borderRadius: 12,
//         maxHeight: '80%',
//     },
//     tabButton: {
//         paddingHorizontal: 12,
//         paddingVertical: 6,
//     },
//     tabButtonActive: {
//         borderBottomWidth: 5,
//         borderBottomHeight:10,
//         borderBottomColor: '#FFB800',
//     },
//     tabText: {
//         fontSize: 14,
//         color: 'white',
//     },
//     tabContainer: {
//         flexDirection: 'row',
//         justifyContent: 'space-around',
//         marginBottom: 12,
//         // marginTop: 10,
//         backgroundColor: '#090446',
//         paddingHorizontal:10,
//         paddingTop: 10,

//     },
//     tabTextActive: {
//         color: '#FFB800',
//         fontWeight: '600',
//     },
//     listContainer: {
//         padding: 16,
//     },
//     searchWrapper: {
//         marginHorizontal: 20,
//         marginTop: 10,
//         marginBottom: 10,
        
//     },
//     listItem: {
//         paddingVertical: 12,
//         borderBottomWidth: 1,
//         borderBottomColor: '#e0e0e0',
//         width: SCREEN_WIDTH,
//         marginVertical: 2,
//         paddingHorizontal: 10,
//     },
// });
// return (
 return (
  <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
    <View style={styles.tabContainer}>
      <TouchableOpacity
        onPress={() => setActiveTab('add')}
        style={[styles.tabButton, activeTab === 'add' && styles.tabButtonActive]}
      >
        <Text
          style={[styles.tabText, activeTab === 'add' && styles.tabTextActive]}
        >
          Add Customer
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setActiveTab('choose')}
        style={[styles.tabButton, activeTab === 'choose' && styles.tabButtonActive]}
      >
        <Text
          style={[styles.tabText, activeTab === 'choose' && styles.tabTextActive]}
        >
          Choose Customer
        </Text>
      </TouchableOpacity>
    </View>

    {activeTab === 'add' ? (
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add Customer</Text>

          <View style={styles.inputWrapper}>
            <InputPaper
              label="Customer Name"
              value={name}
              onChangeText={(val) => setName(val as string)}
              mode="outlined"
              maxLength={100}
              style={styles.input}
              labelStyle={styles.inputLabel}
            />
          </View>

          <View style={styles.inputWrapper}>
            <InputPaper
              label="Phone Number"
              value={phone}
              onChangeText={(val) => setPhone(val as string)}
              keyboardType="phone-pad"
              mode="outlined"
              maxLength={15}
              style={styles.input}
              labelStyle={styles.inputLabel}
            />
          </View>

          <View style={styles.locationContainer}>
            <Text style={styles.locationLabel}>
              Location:{' '}
              {location
                ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
                : 'Not Captured'}
            </Text>
            {address ? (
              <Text style={styles.locationAddress}>
                {address}
              </Text>
            ) : null}
            <ButtonPaper
              icon="map-marker-radius"
              mode="contained-tonal"
              onPress={getLocation}
              loading={loadingLocation}
              disabled={loadingLocation}
              style={styles.locationButton}
            >
              {location ? 'Recapture Location' : 'Capture Current Location'}
            </ButtonPaper>
          </View>

          <View style={styles.actionButtonContainer}>
            <ButtonPaper
              mode="contained"
              buttonColor="#090446"
              textColor="#FFFFFF"
              onPress={handleSave}
              loading={isLoading}
              disabled={isLoading || !name.trim() || !phone.trim() || !location}
              style={styles.saveButton}
            >
              Save Customer
            </ButtonPaper>
          </View>
        </View>
      </ScrollView>
    ) : (
      <View style={styles.container}>
        <View style={styles.searchWrapper}>
          <InputPaper
            label="Search Customer"
            value={customerSearch}
            onChangeText={(val) => setCustomerSearch(val as string)}
            mode="outlined"
            style={styles.searchInput}
          />
        </View>

        <FlatList
          data={(customerList || []).filter((c: any) => {
            const q = customerSearch.trim().toLowerCase();
            if (!q) return true;
            const label = (c?.label ?? '').toString().toLowerCase();
            const value = (c?.value ?? '').toString().toLowerCase();
            return label.includes(q) || value.includes(q);
          })}
          keyExtractor={(item) => item.value?.toString() ?? ''}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setCustomer(item);
                navigation.dispatch(
                  CommonActions.navigate({
                    name: navigationRoutes.bottomNavigationPaper,
                    params: {
                      screen: 'Categories',
                    },
                  })
                );
              }}
              activeOpacity={0.7}
            >
              <View style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemLabel}>{item.label}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      </View>
    )}
  </SafeAreaView>
);
// );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputWrapper: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  inputLabel: {
    fontWeight: '700',
  },
  locationContainer: {
    marginVertical: 15,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    backgroundColor: '#E3E5E8',
  },
  locationLabel: {
    marginBottom: 5,
    color: '#5F6368',
    fontSize: 14,
    fontWeight: '600',
  },
  locationAddress: {
    marginBottom: 15,
    textAlign: 'center',
    color: '#5F6368',
    fontSize: 13,
  },
  locationButton: {
    minWidth: '60%',
  },
  actionButtonContainer: {
    marginTop: 10,
  },
  saveButton: {
    borderRadius: 12,
  },
  card: {
    marginHorizontal: 20,
    marginVertical: 60,
    borderRadius: 24,
    padding: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E3E5E8',
  },
  cardTitle: {
    color: '#090446',
    fontWeight: '700',
    marginBottom: 10,
    fontSize: 18,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tabButtonActive: {
    borderBottomWidth: 5,
    borderBottomColor: '#FFB800',
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    borderRadius: 8,
  },
  tabText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFB800',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    backgroundColor: '#090446',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  listContainer: {
    padding: 16,
  },
  searchWrapper: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
  },
  listItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    width: SCREEN_WIDTH,
    marginVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listItemLabel: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#090446',
  },
});
export default AddCustomerScreen;


