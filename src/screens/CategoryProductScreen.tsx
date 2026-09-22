import React, { useCallback, useContext, useEffect, useState } from "react"
import {
    StyleSheet,
    ScrollView,
    SafeAreaView,
    View,
    ToastAndroid,
    Alert,
    Image
} from "react-native"
import { Card, Divider, List, RadioButton, Text, TouchableRipple } from "react-native-paper"
import HeaderImage from "../components/HeaderImage"
import {
    textureReport,
    textureReportDark,
} from "../resources/images"
import { usePaperColorScheme } from "../theme/theme"
import { CommonActions, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native"
import { itemsContextStorage, loginStorage } from "../storage/appStorage"
import { AppStore } from "../context/AppContext"
import { CategoriesScreenRouteProp, CategoryProductScreenRouteProp } from "../models/route_types"
import useCategoryItems from "../hooks/api/useCategoryItems"
import { CategoryItemListCredentials, ItemsData, StockSearchCredentials } from "../models/api_types"
import normalize, { SCREEN_HEIGHT, SCREEN_WIDTH } from "react-native-normalize"
import AddRemove from "../components/AddRemove"
import useStockSearch from "../hooks/api/useStockSearch"
import DialogBox from "../components/DialogBox"
import { AppStoreContext } from "../models/custom_types"
import { clearStates } from "../utils/clearStates"
import InputPaper from "../components/InputPaper"
import navigationRoutes from "../routes/navigationRoutes"
import SnackBar from "../components/SnackBar"
import ButtonPaper from "../components/ButtonPaper"
import SurfacePaper from "../components/SurfacePaper"
import { logo, logoDark, flower2, flower2Dark } from "../resources/images"
import ReportButtonsWrapper from "../components/ReportButtonsWrapper"
import slikCut from "../resources/images/test_images/sc.jpg"
import { ADDRESSES } from "../config/api_list"
import { buildNormalizedCartItems, getSelectedPriceValue } from "../utils/priceSelection"

function CategoryProductScreen() {
    const theme = usePaperColorScheme()
    const navigation = useNavigation()
    const { receiptSettings } = useContext<AppStoreContext>(AppStore)
    const { fetchCategoryItems } = useCategoryItems()
    const { params } = useRoute<CategoryProductScreenRouteProp>()
    const loginStore = JSON.parse(loginStorage.getString("login-data") as "")
    let itemsStore: []
    let totalAmountStore: number
    let totalDiscountedAmountStore: number

    try {
        const itemsData = itemsContextStorage.getString("items-data")
        const totalAmountData = itemsContextStorage.getString("total-amount-data")
        const totalDiscountedAmountData = itemsContextStorage.getString("total-discount-data")
        // console.log(itemsData)
        itemsStore = itemsData ? JSON.parse(itemsData) : []
        totalAmountStore = totalAmountData ? parseFloat(totalAmountData) : 0
        totalDiscountedAmountStore = totalDiscountedAmountData ? parseFloat(totalDiscountedAmountData) : 0
    } catch (error) {
        console.error("Failed to parse items-data:", error)
        itemsStore = []
        totalAmountStore = 0
        totalDiscountedAmountStore = 0
    }

    const { fetchStock } = useStockSearch()

    const [visible, setVisible] = useState(() => false)
    const hideDialog = () => setVisible(() => false)

    const [categoryWiseItems, setCategoryWiseItems] = useState<ItemsData[]>()
    const [product, setProduct] = useState<ItemsData>()
    const [quantity, setQuantity] = useState<number>()
    const [discountState, setDiscountState] = useState<number>(() => 0)
    const [price, setPrice] = useState<number>(() => product?.price)
    const [selectedPriceType, setSelectedPriceType] = useState<"price" | "new_ptr">("price")
    const [stock, setStock] = useState<number>()
    const [updatedStock, setUpdatedStock] = useState<number>()
    console.log(itemsStore, 'itemsStore')
    const [addedProductsList, setAddedProductsList] = useState<ItemsData[]>(
        () => itemsStore,
    )

    const normalizeAddedProductsForSelection = (products: ItemsData[] = addedProductsList, type: "price" | "new_ptr" = selectedPriceType) =>
        buildNormalizedCartItems(products as any, type) as ItemsData[]


    const [totalPrice, setTotalPrice] = useState(() => totalAmountStore | 0)
    const [totalDiscountedAmount, setTotalDiscountedAmount] = useState(() => totalDiscountedAmountStore | 0)

    const handleFetchStock = async (itemId: number) => {
        let fetchedStockObject: StockSearchCredentials = {
            comp_id: loginStore?.comp_id,
            br_id: loginStore?.br_id,
            item_id: itemId,
        }



        await fetchStock(fetchedStockObject)
            .then(res => {
                console.log("handleFetchStock fetchStock", res)
                setStock(res?.stock)
            })
            .catch(err => {
                console.log("Something went wrong in handleFetchStock!", err)
            })
    }

    const handleGetItemsByCategoryId = async (catgId: number) => {
        const creds: CategoryItemListCredentials = {
            comp_id: loginStore?.comp_id,
            br_id: loginStore?.br_id,
            catg_id: catgId,
            user_id: loginStore?.user_id
        }
        fetchCategoryItems(creds).then(res => {
            setCategoryWiseItems(res?.msg)
        }).catch(err => {
            ToastAndroid.show(`Some error occurred while fetching items.`, ToastAndroid.SHORT)
        })
    }

    const productDetails = (item: ItemsData) => {
        setProduct(item)

        setDiscountState(item?.discount)
        setPrice(getSelectedPriceValue(item, selectedPriceType))
        setQuantity(
            addedProductsList?.find(i => i.item_id === item?.item_id)?.quantity || 0
        )
        handleFetchStock(item?.item_id)
        setVisible(!visible)
    }

    useEffect(() => {
        if (product) {
            setPrice(getSelectedPriceValue(product, selectedPriceType))
        }
    }, [product, selectedPriceType])

    useEffect(() => {
        setAddedProductsList(prevList => {
            const normalizedList = normalizeAddedProductsForSelection(prevList, selectedPriceType)
            const { totalAmount, totalDiscount } = normalizedList.reduce((acc, item) => {
                // const itemTotalPrice = item?.price * item["quantity"]
                const itemTotalPrice = getSelectedPriceValue(item as any, item?.priceType || selectedPriceType) * item["quantity"]
                let itemDiscount = 0

                if (receiptSettings?.discount_flag === "Y") {
                    if (receiptSettings?.discount_position === "I") {
                        if (receiptSettings?.discount_type === "A") {
                            itemDiscount = (item["quantity"] * item["discount"])
                        } else {
                            itemDiscount = (getSelectedPriceValue(item as any, item?.priceType || selectedPriceType) * item["quantity"] * item["discount"]) / 100
                            // itemDiscount = (item?.price * item["quantity"] * item["discount"]) / 100
                        }
                    }
                }

                return {
                    totalAmount: acc.totalAmount + itemTotalPrice,
                    totalDiscount: acc.totalDiscount + itemDiscount,
                }
            }, { totalAmount: 0, totalDiscount: 0 })
            setTotalPrice(totalAmount)
            setTotalDiscountedAmount(totalDiscount)
            itemsContextStorage.set("total-amount-data", totalAmount?.toString())
            itemsContextStorage.set("total-discount-data", totalDiscount?.toString())
            itemsContextStorage.set("items-data", JSON.stringify(normalizedList))

            return normalizedList
        })
    }, [selectedPriceType, receiptSettings?.discount_flag, receiptSettings?.discount_position, receiptSettings?.discount_type])

    useEffect(() => {
        handleGetItemsByCategoryId(params?.product?.catg_id)
    }, [])

    // Re-fetch items every time the screen is focused so switching categories always loads fresh data
    useFocusEffect(
        useCallback(() => {
            handleGetItemsByCategoryId(params?.product?.catg_id)
        }, [params?.product?.catg_id])
    )

    // Increse quantity Product when ENTER
    // useEffect(() => {
    //     const prod = params?.product
    //     if (!prod) return

    //     const initialQty = getQuantity(prod.item_id)
    //     if (initialQty === 0) {
    //         add(prod)
    //     }
    // }, [])

    const onDialogFailure = () => {
        clearStates([setQuantity, setStock, setUpdatedStock], () => undefined)

        setVisible(!visible)
    }

    const onDialogSuccecss = (item: ItemsData) => {
        setAddedProductsList(prevList => {
            const existingItemIndex = prevList.findIndex(product => product.id === item.id)
            const selectedAmount = getSelectedPriceValue(item, selectedPriceType)

            if (existingItemIndex !== -1) {
                const updatedList = [...prevList]
                const currentType = updatedList[existingItemIndex]?.priceType || selectedPriceType
                updatedList[existingItemIndex] = {
                    ...updatedList[existingItemIndex],
                    // basePrice: updatedList[existingItemIndex]?.basePrice ?? updatedList[existingItemIndex]?.mrp ?? updatedList[existingItemIndex]?.price ?? 0,
                    basePrice: updatedList[existingItemIndex]?.basePrice ?? updatedList[existingItemIndex]?.price ?? 0,
                    effectivePrice: getSelectedPriceValue(updatedList[existingItemIndex] as any, currentType),
                    priceType: currentType,
                    //@ts-ignore
                    quantity: parseInt(quantity),
                    //@ts-ignore
                    discount: parseInt(discountState)
                }
                return updatedList
            } else {
                // Item doesn't exist, add it with quantity 1
                //@ts-ignore
                return [...prevList, {
                    ...item,
                    //@ts-ignore
                    quantity: parseInt(quantity),
                    //@ts-ignore
                    discount: parseFloat(discountState) > 0 ? parseFloat(discountState) : parseFloat(product?.discount),
                    // basePrice: item?.basePrice ?? item?.mrp ?? item?.price ?? 0,
                    basePrice: item?.basePrice ?? item?.price ?? 0,
                    effectivePrice: selectedAmount,
                    priceType: selectedPriceType,
                }]
            }
        })
        setVisible(!visible)
    }

    const onDialogSuccessChange = (item: ItemsData) => {
        if (receiptSettings?.stock_flag === "Y") {
            if (
                quantity <= 0 ||
                typeof quantity === "undefined" ||
                Number.isNaN(quantity) ||
                updatedStock < 0
            ) {
                ToastAndroid.show("Try adding valid numbers!", ToastAndroid.SHORT)
                return
            }
        } else {
            if (
                quantity <= 0 ||
                typeof quantity === "undefined" ||
                Number.isNaN(quantity)
            ) {
                ToastAndroid.show("Try adding valid numbers!", ToastAndroid.SHORT)
                return
            }
        }

        if (receiptSettings?.discount_type === "P") {
            if (discountState > 100) {
                ToastAndroid.show(
                    "Discount cannot be greater than 100%.",
                    ToastAndroid.SHORT,
                )
                return
            }
        } else if (product.price * quantity < discountState) {
            ToastAndroid.show("Give valid Discount Amount.", ToastAndroid.SHORT)
            return
        }

        if (receiptSettings?.stock_flag === "Y") {
            if (stock === undefined || stock === null) {
                ToastAndroid.show(
                    "No stock available. Add stock for this product.",
                    ToastAndroid.SHORT,
                )
                return
            }
        }

        onDialogSuccecss(item)
    }

    useEffect(() => {
        //@ts-ignore
        setUpdatedStock(parseInt(stock) - parseInt(quantity))
    }, [quantity])

    const countTotalAmountAndTotalDiscount = () => {
        const normalizedList = normalizeAddedProductsForSelection(addedProductsList, selectedPriceType)
        const { totalAmount, totalDiscount } = normalizedList.reduce((acc, item) => {
            // const itemTotalPrice = item?.price * item["quantity"]
            const itemTotalPrice = +displayPrice * item["quantity"]
            let itemDiscount = 0

            if (receiptSettings?.discount_flag === "Y") {
                if (receiptSettings?.discount_position === "I") {
                    if (receiptSettings?.discount_type === "A") {
                        itemDiscount = (item["quantity"] * item["discount"])
                    } else {
                        itemDiscount = (+displayPrice * item["quantity"] * item["discount"]) / 100
                        // itemDiscount = (item?.price * item["quantity"] * item["discount"]) / 100
                    }
                }
            }

            return {
                totalAmount: acc.totalAmount + itemTotalPrice,
                totalDiscount: acc.totalDiscount + itemDiscount,
            }
        }, { totalAmount: 0, totalDiscount: 0 })
        setTotalPrice(totalAmount)
        setTotalDiscountedAmount(totalDiscount)

        itemsContextStorage.set("total-amount-data", totalAmount?.toString())
        itemsContextStorage.set("total-discount-data", totalDiscount?.toString())
        itemsContextStorage.set("items-data", JSON.stringify(normalizedList))
    }

    useEffect(() => {
        countTotalAmountAndTotalDiscount()
    }, [addedProductsList, selectedPriceType, receiptSettings?.discount_flag, receiptSettings?.discount_position, receiptSettings?.discount_type])

    const handleOnDelete = (product: ItemsData) => {
        setAddedProductsList(prevData =>
            prevData?.filter((item, index) => item.item_id !== product.item_id),
        )

        // navigation.goBack()

        setVisible(!visible)
    }

    // const handleOnDelete = (product: ItemsData) => {
    // // Remove the product from addedProductsList
    // setAddedProductsList(prevData => 
    //     prevData?.filter(item => item.item_id !== product.item_id)
    // );

    // // Close the dialog
    // setVisible(false);
    // };

    const handlePressBillScreen = () => {
        const normalizedProducts = normalizeAddedProductsForSelection(addedProductsList, selectedPriceType)
        navigation.dispatch(
            CommonActions.navigate({
                name: navigationRoutes.cartScreen,
                params: {
                    added_products: normalizedProducts,
                    net_total: totalPrice,
                    total_discount: totalDiscountedAmount,
                },
            }),
        )
        // navigation.dispatch(
        //     CommonActions.navigate({
        //         name: navigationRoutes.customerDetailsFillScreen,
        //         params: {
        //             added_products: addedProductsList,
        //             net_total: totalPrice,
        //             total_discount: totalDiscountedAmount,
        //             // table_no: tableNo,
        //         },
        //     }),
        // )
    }

    const add = (item: ItemsData) => {
        handleFetchStock(item?.item_id)
        setAddedProductsList(prevList => {
            const existingItemIndex = prevList.findIndex(product => product.id === item.id)
            if (existingItemIndex !== -1) {
                // Item exists, create a new array with updated quantity
                const updatedList = [...prevList]
                updatedList[existingItemIndex] = {
                    ...updatedList[existingItemIndex],
                    //@ts-ignore
                    quantity: parseInt(updatedList[existingItemIndex].quantity || 0) + 1,
                    // basePrice: updatedList[existingItemIndex]?.basePrice ?? updatedList[existingItemIndex]?.mrp ?? updatedList[existingItemIndex]?.price ?? 0,
                    basePrice: updatedList[existingItemIndex]?.basePrice ?? updatedList[existingItemIndex]?.price ?? 0,
                    effectivePrice: getSelectedPriceValue(updatedList[existingItemIndex] as any, updatedList[existingItemIndex]?.priceType || selectedPriceType),
                    priceType: updatedList[existingItemIndex]?.priceType || selectedPriceType,
                }
                return updatedList
            } else {
                // Item doesn't exist, add it with quantity 1
                return [
                    ...prevList,
                    {
                        ...item,
                        quantity: 1,
                        basePrice: item?.basePrice ?? item?.price ?? 0,
                        effectivePrice: getSelectedPriceValue(item as any, selectedPriceType),
                        priceType: selectedPriceType,
                    }
                ]
            }
        })
    }

    const remove = (item: ItemsData) => {
        setAddedProductsList(prevList => {
            const existingItemIndex = prevList.findIndex(product => product.id === item.id)
            if (existingItemIndex !== -1) {
                if (prevList[existingItemIndex].quantity > 1) {
                    // Item exists and quantity is greater than 1, create a new array with updated quantity
                    const updatedList = [...prevList]
                    updatedList[existingItemIndex] = {
                        ...updatedList[existingItemIndex],
                        quantity: updatedList[existingItemIndex].quantity - 1,
                    }
                    return updatedList
                } else {
                    // Item exists and quantity is 1, remove the item from the list
                    return prevList.filter(product => product.id !== item.id)
                }
            } else {
                return prevList
            }
        })
    }

    const handleClear = () => {
        Alert.alert("Clear cart?", "Do you want to clear cart?", [
            { text: "NO", onPress: () => null },
            {
                text: "YES", onPress: () => {
                    setAddedProductsList(() => [])
                    itemsContextStorage.clearAll()
                }
            }
        ])
    }

    const displayPrice = getSelectedPriceValue(params?.product, selectedPriceType)

    const handlePriceTypeChange = (nextType: "price" | "new_ptr") => {
        setSelectedPriceType(nextType)
        setAddedProductsList(prevList => prevList.map(item => {
            if (item.item_id !== params?.product?.item_id) return item
            return {
                ...item,
                priceType: nextType,
                effectivePrice: getSelectedPriceValue(item as any, nextType),
                basePrice: item?.basePrice ?? item?.price ?? 0,
            }
        }))
    }

    // Find the quantity for each item
    const getQuantity = (itemId: number) => {
        const item = addedProductsList.find(product => product.item_id === itemId)
        return item ? item.quantity : 0
    }

    const handleGoToCartScreen = () => {
        const normalizedProducts = normalizeAddedProductsForSelection(addedProductsList, selectedPriceType)

        navigation.dispatch(
            CommonActions.navigate({
                name: navigationRoutes.cartScreen,
                params: {
                    added_products: normalizedProducts,
                    net_total: totalPrice,
                    total_discount: totalDiscountedAmount,
                    // table_no: tableNo,
                },
            }),
        )
    }

    // const onChangeQty = (txt: any) => {
    //     setQuantity(+txt)
    //     onDialogSuccessChange(product)
    // }

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView keyboardShouldPersistTaps="handled">
                <View style={{ alignItems: "center" }}>
                    <HeaderImage
                        imgLight={textureReport}
                        imgDark={textureReportDark}
                        borderRadius={30}
                        blur={10}
                        categoryName={params?.categoryName}
                        isBackEnabled>
                        {params?.product?.item_name}
                    </HeaderImage>
                </View>

                {/* <View
                    style={{
                        alignSelf: "center",
                        width: "85%",
                        marginTop: -9,
                        paddingBottom: normalize(10),
                    }}>
                    <ButtonPaper
                        icon="magnify-scan"
                        mode="contained"
                        buttonColor={theme.colors.vanillaContainer}
                        onPress={() => navigation.dispatch(
                            CommonActions.navigate(
                                {
                                    name: navigationRoutes.categoryProductsScreen,
                                    params: {
                                        category_id: 0,
                                        category_name: "All Items",
                                        category_photo: ""
                                    }
                                }
                            )
                        )}
                        textColor={theme.colors.onVanillaContainer}>
                        SEARCH PRODUCTS
                    </ButtonPaper>
                </View> */}

                <View style={{
                    paddingHorizontal: normalize(25),
                    paddingBottom: normalize(10),
                    maxHeight: SCREEN_HEIGHT / 2
                }}>
                    <ScrollView style={{
                        // borderWidth: 2,
                        // borderColor: theme.colors.vanillaSecondary,
                        // borderStyle: "dashed",
                        // borderRadius: 20,
                        padding: 10,
                    }} nestedScrollEnabled>
                        <View style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: 10,
                            justifyContent: "space-between",
                            marginBottom: 25
                        }}>
                            {
                                [params?.product]?.map((item, i) => {
                                    return (
                                        <View key={i} style={{ width: "100%" }}>
                                            <List.Item
                                                style={{
                                                    paddingVertical: 10
                                                }}
                                                onPress={() => productDetails(item)}
                                                title={({ ellipsizeMode }) => <Text variant="titleMedium" style={{
                                                    flexWrap: "wrap",
                                                    // right: 12
                                                }} numberOfLines={3} ellipsizeMode="tail">{item?.item_name}</Text>}
                                                description={(() => {
                                                    const qty = getQuantity(item?.item_id);
                                                    const activePrice = getSelectedPriceValue(item, selectedPriceType)
                                                    const sticksPerPkt = item?.sticks_per_packet ?? 0;
                                                    const remainingPackets = (item?.curr_packet ?? 0) - qty;
                                                    const remainingSticks = (item?.curr_total_sticks ?? 0) - (qty * sticksPerPkt);
                                                    return loginStore?.stock_flag === 'N'
                                                        ? `₹${activePrice}`
                                                        : `₹${activePrice}   |   Remaining — Packets: ${remainingPackets}   Sticks: ${remainingSticks}`;
                                                })()}
                                                right={props => {
                                                    return <AddRemove
                                                        value={getQuantity(item?.item_id)}
                                                        add={() => add(item)}
                                                        remove={() => remove(item)}
                                                        key={item?.item_id}
                                                        isAddDisabled={receiptSettings?.stock_flag === "Y" && getQuantity(item?.item_id) === item?.stock}
                                                        onChange={txt => setQuantity(txt)}
                                                        isIndividualProductScreen />
                                                }}
                                                descriptionStyle={{
                                                    color: theme.colors.primary,
                                                    backgroundColor: '#d4eeca',
                                                    borderRadius: 12,
                                                    paddingHorizontal: 2,
                                                    paddingVertical: 2,
                                                    alignSelf: "flex-start",
                                                    marginTop: 4
                                                }}
                                            />

                                            {/* <TouchableRipple
                                                    onPress={() => {
                                                        navigation.dispatch(CommonActions.navigate(""))
                                                    }}
                                                >
                                                    <View style={{
                                                        backgroundColor: theme.colors.primaryContainer,
                                                        borderRadius: 5
                                                    }}>
                                                        <View style={{
                                                            padding: 5
                                                        }}>
                                                            <Image
                                                                source={slikCut}
                                                                style={{ height: 80, width: 80 }}
                                                            />
                                                        </View>
                                                        <View style={{
                                                            padding: 5
                                                        }}>
                                                            <Text variant="bodySmall" style={{
                                                                color: theme.colors.onPrimaryContainer,
                                                                fontWeight: "800",
                                                            }} numberOfLines={1} ellipsizeMode="tail">{item?.item_name?.length > 6 ? `${item?.item_name?.substring(0, 6)}...` : item?.item_name}</Text>
                                                            <Text variant="bodySmall" style={{
                                                                color: theme.colors.secondary,
                                                                fontWeight: "800"
                                                            }}>₹ {item?.price}</Text>
                                                        </View>
                                                    </View>
                                                </TouchableRipple> */}
                                            <Divider />
                                        </View>
                                    )
                                })
                            }
                        </View>

                        {/* <View style={{
                            width: "100%",
                            height: "auto",
                            backgroundColor: theme.colors.vanillaContainer,
                            padding: 10,
                            paddingHorizontal: 20,
                            justifyContent: "center",
                            alignItems: "flex-start",
                            alignSelf: "center",
                            borderRadius: 25
                        }}>
                           
                            <Text variant="headlineLarge" style={{
                                color: theme.colors.onVanillaContainer
                            }}>Selling Price: ₹{params?.product?.price}</Text>
                            <Text variant="headlineMedium" style={{
                                backgroundColor: theme.colors.vanilla,
                                padding: 10,
                                width: "100%",
                                color: theme.colors.onVanilla,
                                alignSelf: "center",
                                borderRadius: 18,
                                textAlign: "center"
                            }}>Price: {params?.product?.price} × {getQuantity(params?.product?.item_id)} = ₹{(+params?.product?.price * +getQuantity(params?.product?.item_id))?.toFixed(2)}</Text>
                           
                        </View> */}
                        <View
                            style={{
                                width: "100%",
                                // backgroundColor: theme.colors.vanillaContainer,
                                paddingVertical: 1,
                                paddingHorizontal: 2,
                                borderRadius: 28,
                                alignSelf: "center",

                                // Professional depth

                            }}
                        >
                            {/* Header */}

                            <View
                                style={{
                                    width: "100%",
                                    backgroundColor: theme.colors.vanillaContainer,
                                    padding: 20,
                                    borderRadius: 28,

                                    // depth
                                    elevation: 5,
                                    shadowColor: "#000",
                                    shadowOpacity: 0.08,
                                    shadowRadius: 12,
                                    shadowOffset: {
                                        width: 0,
                                        height: 4
                                    },

                                    gap: 18
                                }}
                            >

                                {/* Header */}
                                <View style={{
                                    gap: 4
                                }}>
                                    <Text
                                        variant="labelLarge"
                                        style={{
                                            color: theme.colors.onVanillaContainer,
                                            opacity: 0.7,
                                            letterSpacing: 1
                                        }}
                                    >
                                        SELLING PRICE
                                    </Text>

                                    <Text
                                        variant="displaySmall"
                                        style={{
                                            color: theme.colors.onVanillaContainer,
                                            fontWeight: "700"
                                        }}
                                    >
                                        ₹{displayPrice}
                                    </Text>
                                </View>

                                {params?.product?.new_ptr != params?.product?.price && <View style={{ marginTop: 8 }}>
                                    <Text
                                        variant="labelMedium"
                                        style={{
                                            color: theme.colors.onVanillaContainer,
                                            opacity: 0.75,
                                            marginBottom: 4,
                                        }}
                                    >
                                        PRICE TYPE
                                    </Text>
                                    <RadioButton.Group
                                        onValueChange={value => handlePriceTypeChange(value as "price" | "new_ptr")}
                                        value={selectedPriceType}
                                    >
                                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                                <RadioButton value="price" />
                                                <Text variant="bodyMedium">Old PTR</Text>
                                            </View>
                                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                                <RadioButton value="new_ptr" />
                                                <Text variant="bodyMedium">New PTR</Text>
                                            </View>
                                        </View>
                                    </RadioButton.Group>
                                </View>}

                                {/* Divider */}
                                <View
                                    style={{
                                        height: 1,
                                        width: "100%",
                                        backgroundColor: "rgba(0,0,0,0.08)"
                                    }}
                                />

                                {/* Calculation Card */}
                                <View
                                    style={{
                                        width: "100%",
                                        backgroundColor: theme.colors.vanilla,
                                        paddingVertical: 18,
                                        paddingHorizontal: 16,
                                        borderRadius: 22,
                                        gap: 10
                                    }}
                                >

                                    <View style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        alignItems: "center"
                                    }}>
                                        <Text
                                            variant="titleMedium"
                                            style={{
                                                color: theme.colors.onVanilla,
                                                opacity: 0.75
                                            }}
                                        >
                                            Unit Price
                                        </Text>

                                        <Text
                                            variant="titleLarge"
                                            style={{
                                                color: theme.colors.onVanilla,
                                                fontWeight: "600"
                                            }}
                                        >
                                            ₹{displayPrice}
                                        </Text>
                                    </View>

                                    <View style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        alignItems: "center"
                                    }}>
                                        <Text
                                            variant="titleMedium"
                                            style={{
                                                color: theme.colors.onVanilla,
                                                opacity: 0.75
                                            }}
                                        >
                                            Quantity
                                        </Text>

                                        <Text
                                            variant="titleLarge"
                                            style={{
                                                color: theme.colors.onVanilla,
                                                fontWeight: "600"
                                            }}
                                        >
                                            × {getQuantity(params?.product?.item_id)}
                                        </Text>
                                    </View>

                                    <View
                                        style={{
                                            height: 1,
                                            backgroundColor: "rgba(0,0,0,0.08)",
                                            marginVertical: 4
                                        }}
                                    />

                                    <View style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        alignItems: "center"
                                    }}>
                                        <Text
                                            variant="headlineSmall"
                                            style={{
                                                color: theme.colors.onVanilla,
                                                fontWeight: "700"
                                            }}
                                        >
                                            Total
                                        </Text>

                                        <Text
                                            variant="headlineMedium"
                                            style={{
                                                color: theme.colors.onVanilla,
                                                fontWeight: "800"
                                            }}
                                        >
                                            ₹{(
                                                +displayPrice *
                                                +getQuantity(params?.product?.item_id)
                                            ).toFixed(2)}
                                        </Text>
                                    </View>

                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    <View style={{
                        marginHorizontal: 10,
                        marginVertical: 12,
                        // justifyContent: "center",
                        // alignItems: "center",
                    }}>
                        <ButtonPaper mode="elevated" onPress={() => navigation.dispatch(
                            // CommonActions.navigate(
                            //     {
                            //         name: navigationRoutes.categoryProductsScreen,
                            //         params: {
                            //             category_id: 0,
                            //             category_name: "All Items",
                            //             category_photo: ""
                            //         }
                            //     }
                            // )
                            CommonActions.navigate({ name: navigationRoutes.categoriesScreen })
                        )} icon="plus-thick" textColor={theme.colors.onPrimary} buttonColor={theme.colors.error}>ADD ITEM</ButtonPaper>
                    </View>

                </View>
            </ScrollView>

            <View style={{
                position: "absolute",
                top: "87.2%",
                alignSelf: "center"
            }}>


                <SnackBar totAmt={+displayPrice * +getQuantity(params?.product?.item_id)?.toFixed(2)} handleBtn1Press={handlePressBillScreen} handleBtn2Press={handleClear} handleBtn3Press={handleGoToCartScreen} disableNext={!totalPrice} cartItemQty={addedProductsList?.length} disableCart={!totalPrice} />
            </View>

            <DialogBox
                iconSize={40}
                visible={visible}
                hide={hideDialog}
                titleStyle={styles.title}
                btnSuccess={"ADD"}
                onFailure={onDialogFailure}
                onSuccess={() => onDialogSuccessChange(product)}>
                <View style={styles.modalContainer}>
                    {/* <View style={{ alignItems: "center" }}>
                        <View>
                            <Text
                                variant="titleLarge"
                                style={{ color: theme.colors.primary }}>
                                {product?.item_name}
                            </Text>
                        </View>
                    </View> */}

                    {/* <View
                        style={{
                            borderWidth: 1,
                            borderColor: theme.colors.primary,
                            margin: 10,
                            borderRadius: 10,
                            borderStyle: "dashed",
                        }}>
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: 5,
                                borderColor: theme.colors.primary,
                            }}>
                            <Text variant="labelMedium">PRODUCT ID</Text>
                            <Text variant="labelMedium">{product?.id}</Text>
                        </View>

                        {receiptSettings?.unit_flag === "Y" && (
                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: 5,
                                }}>
                                <Text variant="labelMedium">UNIT</Text>
                                <Text variant="labelMedium">{product?.unit_name || ""}</Text>
                            </View>
                        )}
                    </View> */}

                    {/* <View
                        style={
                            receiptSettings?.price_type === "A" && {
                                borderWidth: 1,
                                borderColor: theme.colors.primary,
                                margin: 10,
                                borderRadius: 10,
                                borderStyle: "dashed",
                            }
                        }>
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: 5,
                            }}>
                            {receiptSettings?.price_type === "A" ? (
                                <>
                                    <Text variant="labelMedium">UNIT PRICE</Text>
                                    <Text variant="labelMedium">₹{product?.price}</Text>
                                </>
                            ) : (
                                <View
                                    style={{
                                        flex: 1,
                                        justifyContent: "center",
                                        paddingHorizontal: 5,
                                    }}>
                                    <InputPaper
                                        selectTextOnFocus
                                        label="Unit Price"
                                        onChangeText={(txt: number) => setPrice(txt)}
                                        value={price}
                                        keyboardType="numeric"
                                        // autoFocus={true}
                                        mode="outlined"
                                    />
                                </View>
                            )}
                        </View>
                    </View> */}

                    {/* {receiptSettings?.stock_flag === "Y" && (
                        <View
                            style={{
                                borderWidth: 1,
                                borderColor: theme.colors.primary,
                                margin: 10,
                                borderRadius: 10,
                                borderStyle: "dashed",
                            }}>
                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: 5,
                                }}>
                                <Text variant="labelMedium">STOCK AVAILABLE</Text>
                                <Text variant="labelMedium">{updatedStock || stock}</Text>
                            </View>
                        </View>
                    )} */}

                    {/* {receiptSettings?.gst_flag === "Y" && (
                        <View
                            style={{
                                borderWidth: 1,
                                borderColor: theme.colors.primary,
                                margin: 10,
                                borderRadius: 10,
                                borderStyle: "dashed",
                            }}>
                            <View style={{ flexDirection: "column", width: "100%" }}>
                                <View
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: 5,
                                        borderColor: theme.colors.primary,
                                        borderStyle: "dashed",
                                    }}>
                                    <Text variant="labelMedium">CGST</Text>
                                    <Text variant="labelMedium">{product?.cgst || ""}%</Text>
                                </View>
                                <View
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: 5,
                                    }}>
                                    <Text variant="labelMedium">SGST</Text>
                                    <Text variant="labelMedium">{product?.sgst || ""}%</Text>
                                </View>
                            </View>
                        </View>
                    )} */}

                    {/* <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginHorizontal: 7,
                            gap: 5,
                        }}>
                        <View
                            style={
                                receiptSettings?.discount_flag === "Y" &&
                                    receiptSettings?.discount_position !== "B"
                                    ? { width: "50%" }
                                    : { width: "100%" }
                            }>
                            <InputPaper
                                selectTextOnFocus
                                label={`Quantity (${(receiptSettings?.unit_flag === "Y" && product?.unit_name) ||
                                    ""
                                    })`}
                                onChangeText={(txt: number) => setQuantity(txt)}
                                value={quantity}
                                keyboardType="numeric"
                                autoFocus={true}
                                mode="outlined"
                            />
                        </View>
                        {receiptSettings?.discount_flag === "Y" &&
                            receiptSettings?.discount_position !== "B" && (
                                <View style={{ width: "50%" }}>
                                    <InputPaper
                                        selectTextOnFocus
                                        label={
                                            receiptSettings?.discount_type === "A"
                                                ? "Discount (₹)"
                                                : "Discount (%)"
                                        }
                                        onChangeText={(dis: number) => setDiscountState(dis)}
                                        value={discountState}
                                        keyboardType="numeric"
                                        mode="outlined"
                                    />
                                </View>
                            )}
                    </View> */}
                    <View
                        style={
                            receiptSettings?.discount_flag === "Y" &&
                                receiptSettings?.discount_position !== "B"
                                ? { width: "50%" }
                                : { width: "100%" }
                        }>
                        <InputPaper
                            selectTextOnFocus
                            label={`Quantity (${(receiptSettings?.unit_flag === "Y" && product?.unit_name) ||
                                ""
                                })`}
                            onChangeText={(txt: number) => setQuantity(txt)}
                            value={quantity}
                            keyboardType="numeric"
                            autoFocus={true}
                            mode="outlined"
                        />
                    </View>
                    {addedProductsList.some(i => i.item_id === product?.item_id) &&
                        <View
                            style={{
                                marginBottom: normalize(-15),
                                marginTop: normalize(10),
                                paddingHorizontal: normalize(10),
                            }}>
                            <ButtonPaper
                                mode="text"
                                textColor={theme.colors.onPurple}
                                buttonColor={theme.colors.purple}
                                icon="trash-can-outline"
                                onPress={() => handleOnDelete(product)}>
                                REMOVE ITEM
                            </ButtonPaper>
                        </View>
                    }
                </View>
            </DialogBox>
        </SafeAreaView>
    )
}

export default CategoryProductScreen

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
    },

    title: {
        textAlign: "center",
    },

    modalContainer: {
        justifyContent: "space-between",
        // minHeight: normalize(230),
        height: "auto",
    },

    fabStyle: {
        bottom: normalize(16),
        right: normalize(16),
        position: "absolute",
    },
})
