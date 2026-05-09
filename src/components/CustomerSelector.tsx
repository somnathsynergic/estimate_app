import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { IconButton, Surface, Text } from 'react-native-paper';
import normalize, { SCREEN_WIDTH } from 'react-native-normalize';
import { usePaperColorScheme } from '../theme/theme';

interface CustomerSelectorProps {
    data: any[];
    value: number | null;
    onChange: (item: any) => void;
    placeholder?: string;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({
    data,
    value,
    onChange,
    placeholder = "Search Customer"
}) => {
    const theme = usePaperColorScheme();

    const renderItem = (item: any) => {
        return (
            <View style={styles.item}>
                <View style={styles.itemContent}>
                    <Text variant="titleMedium" style={{ color: theme.colors.onVanillaSecondaryContainer }}>
                        {item.name}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                        ID: {item.value} • {item.phone}
                    </Text>
                </View>
                <IconButton icon="chevron-right" size={20} iconColor={theme.colors.primary} />
            </View>
        );
    };

    return (
        <Surface style={[styles.container, { backgroundColor: theme.colors.purpleContainer }]} elevation={2}>
            <Dropdown
                style={[styles.dropdown]}
                placeholderStyle={[styles.placeholderStyle, { color: theme.colors.onPurpleContainer }]}
                selectedTextStyle={[styles.selectedTextStyle, { color: theme.colors.onPurpleContainer }]}
                inputSearchStyle={[styles.inputSearchStyle, { backgroundColor: theme.colors.purpleContainer, color: theme.colors.onPurpleContainer }]}
                iconStyle={[styles.iconStyle]}
                containerStyle={{ 
                    backgroundColor: theme.colors.purpleContainer, 
                    borderRadius: 15, 
                    overflow: 'hidden',
                    marginTop: normalize(5),
                    borderWidth: 0.5,
                    borderColor: theme.colors.outlineVariant
                }}
                itemTextStyle={{ color: theme.colors.onPurpleContainer }}
                activeColor={theme.colors.purpleContainer}
                data={data}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder={placeholder}
                searchPlaceholder="Search name or ID..."
                value={value}
                onChange={onChange}
                renderLeftIcon={() => (
                    <IconButton 
                        icon={value ? "account-check" : "account-search-outline"} 
                        size={24} 
                        style={{ margin: 0, marginRight: normalize(5) }} 
                        iconColor={value ? theme.colors.onPurple : theme.colors.onPurpleContainer} 
                    />
                )}
                renderItem={renderItem}
            />
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 15,
        overflow: 'hidden',
        width: '100%',
    },
    dropdown: {
        height: normalize(55),
        paddingHorizontal: normalize(15),
    },
    placeholderStyle: {
        fontSize: 16,
        fontFamily: 'ProductSans-Medium',
    },
    selectedTextStyle: {
        fontSize: 17,
        fontWeight: '600',
        fontFamily: 'ProductSans-Medium',
    },
    iconStyle: {
        width: 24,
        height: 24,
    },
    inputSearchStyle: {
        height: 45,
        fontSize: 16,
        borderRadius: 10,
    },
    item: {
        padding: normalize(15),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    itemContent: {
        flex: 1,
    },
});

export default CustomerSelector;
