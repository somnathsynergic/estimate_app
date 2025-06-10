import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, IconButton, Badge, Text } from 'react-native-paper';
import { usePaperColorScheme } from '../theme/theme';
import ButtonPaper from './ButtonPaper';

const SnackBar = ({
    totAmt,
    cartItemQty = 0,
    totQty = 0,
    handleBtn1Press,
    handleBtn2Press,
    handleBtn3Press,
    disableNext = false,
    hideCart = false,
    disableCart = false,
}) => {
    const theme = usePaperColorScheme();
    return (
        <Surface style={[styles.container, { backgroundColor: theme.colors.primaryContainer }]}>
            {!hideCart && (
                <View style={[styles.iconWrapper, { backgroundColor: theme.colors.secondaryContainer }]}>
                    <IconButton
                        icon="cart-variant"
                        size={24}
                        onPress={handleBtn3Press}
                        disabled={disableCart}
                    />
                    <Badge style={styles.badge} size={18}>{cartItemQty}</Badge>
                </View>
            )}

            <View style={[styles.iconWrapper, { backgroundColor: theme.colors.errorContainer }]}>
                <IconButton
                    icon="trash-can-outline"
                    size={24}
                    onPress={handleBtn2Press}
                />
            </View>

            <View style={styles.infoSection}>
                <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                    TOTAL
                </Text>
                <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer }}>
                    ₹{totAmt}
                </Text>
            </View>

            {totQty > 0 && (
                <View style={styles.infoSection}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                        QTY
                    </Text>
                    <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer }}>
                        {totQty}
                    </Text>
                </View>
            )}

            <ButtonPaper
                mode="contained"
                icon="arrow-right-thick"
                onPress={handleBtn1Press}
                disabled={disableNext}
                style={[styles.nextBtn, { backgroundColor: theme.colors.secondary }]}
            >
                NEXT
            </ButtonPaper>
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        elevation: 4,
        margin: 8,
    },
    iconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 4,
    },
    badge: {
        position: 'absolute',
        top: 2,
        right: 2,
    },
    infoSection: {
        alignItems: 'center',
        marginHorizontal: 8,
    },
    nextBtn: {
        marginLeft: 8,
        borderRadius: 24,
    },
    nextBtnContent: {
        height: 40,
        paddingHorizontal: 16,
    },
});

export default SnackBar;
