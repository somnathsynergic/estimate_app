import React, { PropsWithChildren } from "react"
import { StyleSheet, ImageProps } from "react-native"
import { Text, IconButton, TouchableRipple } from "react-native-paper"
import FastImage from 'react-native-fast-image'
import { IconSource } from "react-native-paper/lib/typescript/components/Icon"
import { BASE_URL, BASE_URL_CATEGORY_IMG } from "../config/config"

type ReportButtonProps = {
  text: string
  onPress?: () => void
  icon?: IconSource
  color?: string
  textColor?: string
  withImage?: boolean
  imageSource?: string
  imageSourceObject?: ImageProps
}

export default function ReportButton({
  text,
  icon,
  color,
  textColor,
  withImage,
  imageSource,
  imageSourceObject,
  onPress,
}: PropsWithChildren<ReportButtonProps>) {
  console.log("RRRRRRRRRRRRRRRRRRRRRRRRR", `${BASE_URL_CATEGORY_IMG}${imageSource}`)
  return (
    <TouchableRipple
      onPress={onPress}
      style={{
        width: 104,
        height: 104,
        padding: 8,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12, // Modern squarer look
        backgroundColor: '#FFFFFF', // Enforced solid white card layout
        elevation: 3, // Premium slight shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        margin: 4,
      }}>
      <>
        {
          imageSource
            ? <FastImage
              source={{
                uri: `${BASE_URL_CATEGORY_IMG}${imageSource}`,
                priority: FastImage.priority.high,
                cache: "immutable"
              }}
              style={styles.buttonImageIconStyle}
              resizeMode={FastImage.resizeMode.cover}
            />
            : <IconButton icon={icon} iconColor="#090446" size={28} style={{ margin: 0 }} />
        }
        <Text style={{ textAlign: "center", color: '#090446', fontFamily: 'ProductSans-Medium', fontSize: 15, marginTop: 2 }}>{text}</Text>
      </>
    </TouchableRipple>
  )
}

const styles = StyleSheet.create({
  buttonImageIconStyle: {
    padding: 10,
    margin: 5,
    height: 50,
    width: 50,
  },
});
