import React, { useState, useContext } from 'react';
import { SafeAreaView, ScrollView, View, StyleSheet, ToastAndroid, Alert, Platform, PermissionsAndroid } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
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

    const { customerList, handleGetCustomerList } = useContext<AppStoreContext>(AppStore);
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
        if (!name || !phone) {
            Alert.alert('Error', 'Name and Phone are mandatory');
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

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScrollView keyboardShouldPersistTaps="handled">
                <View style={{ alignItems: "center" }}>
                    <HeaderImage
                        imgLight={productHeader}
                        imgDark={productHeaderDark}
                        borderRadius={30}
                        blur={10}
                        isBackEnabled={false}
                        showCustomerSelector={false}
                        showProductSearch={false}
                    >
                        Add Customer
                    </HeaderImage>
                </View>

                <View style={styles.container}>
                    <View style={styles.inputWrapper}>
                        <InputPaper
                            label="Customer Name"
                            value={name}
                            onChangeText={(val) => setName(val as string)}
                            mode="outlined"
                            maxLength={100}
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
                        />
                    </View>

                    <View style={[styles.locationContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <Text variant="titleMedium" style={{ marginBottom: 5, color: theme.colors.onSurfaceVariant }}>
                            Location: {location ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : 'Not Captured'}
                        </Text>
                        {address ? (
                            <Text variant="bodyMedium" style={{ marginBottom: 15, textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
                                Address: {address}
                            </Text>
                        ) : null}
                        <ButtonPaper
                            icon="map-marker-radius"
                            mode="contained-tonal"
                            onPress={getLocation}
                            loading={loadingLocation}
                            disabled={loadingLocation}
                        >
                            {location ? 'Recapture Location' : 'Capture Current Location'}
                        </ButtonPaper>
                    </View>

                    <View style={{ marginTop: 20 }}>
                        <ButtonPaper
                            mode="contained"
                            onPress={handleSave}
                            loading={isLoading}
                            disabled={isLoading}
                        >
                            Save Customer
                        </ButtonPaper>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    inputWrapper: {
        marginBottom: 15,
    },
    locationContainer: {
        marginVertical: 15,
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
    }
});

export default AddCustomerScreen;
