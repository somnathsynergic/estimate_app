import { NativeSyntheticEvent, StyleSheet, TextInput, TextInputChangeEventData, View } from 'react-native'
import React, { useState } from 'react'
import { IconButton, Text } from 'react-native-paper'
import { usePaperColorScheme } from '../theme/theme'
import normalize, { SCREEN_WIDTH } from 'react-native-normalize'

type AddRemoveProps = {
    remove: () => void
    add: () => void
    value: number
    isAddDisabled?: boolean
    onChange?: (e: any) => void
    isIndividualProductScreen?: boolean
}

const AddRemove = ({ add, remove, value, isAddDisabled, onChange, isIndividualProductScreen = false }: AddRemoveProps) => {
    const theme = usePaperColorScheme()

    return (
        <View style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
        }}>
            <IconButton style={{
                margin: 0
            }} icon="minus-thick" onPress={remove} mode="contained" iconColor={theme.colors.onErrorContainer} containerColor={theme.colors.errorContainer} size={isIndividualProductScreen ? 25 : 20} />
            <View style={{
                width: !isIndividualProductScreen ? normalize(40) : normalize(45),
                height: !isIndividualProductScreen ? normalize(32) : normalize(38),
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 8,
                backgroundColor: theme.colors.vanillaSecondaryContainer,
                marginHorizontal: 4
            }}>
                <Text variant='bodyMedium' style={{ color: theme.colors.onVanillaSecondaryContainer }}>{value}</Text>
            </View>
            <IconButton disabled={isAddDisabled} style={{
                margin: 0
            }} icon="plus-thick" onPress={add} mode="contained" iconColor={theme.colors.onVanillaTertiaryContainer} containerColor={theme.colors.vanillaTertiaryContainer} size={isIndividualProductScreen ? 25 : 20} />
        </View>
    )
}

export default AddRemove

const styles = StyleSheet.create({})