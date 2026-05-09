import React from "react"
import { Button, StyleSheet, Text, View } from "react-native"
// import { BluetoothEscposPrinter } from "react-native-bluetooth-escpos-printer"
import { hsdLogo } from "./dummy-logo"
import ButtonPaper from "../../components/ButtonPaper"
import { usePaperColorScheme } from "../../theme/theme"

import ThermalPrinterModule from 'react-native-thermal-printer';

async function printreciept() {
  try {
    const text = 
      `[C]============================\n` +
      `[C]Synergic Softek Solutions Pvt. Ltd.\n` +
      `[C]============================\n` +
      `[L]Receipt No: 120\n` +
      `[L]Receipt Date: ${new Date().toLocaleDateString()}\n` +
      `[C]----------------------------\n` +
      `[L]Item                 QTY  AMT\n` +
      `[L]Test Item            1    500\n` +
      `[C]----------------------------\n` +
      `[L]Amount: 500.00\n` +
      `[L]Payment Method: Credit Card\n` +
      `[L]Printed By: Rukshan\n` +
      `[C]============================\n\n\n`;

    await ThermalPrinterModule.printBluetooth({
      payload: text,
      printerNbrCharactersPerLine: 32,
      printerDpi: 120,
      printerWidthMM: 58,
      mmFeedPaper: 25,
    });
  } catch (e) {
    alert("Printer is not connected.");
  }
}

const SamplePrint = () => {
  const theme = usePaperColorScheme()
  return (
    <View>
      <View style={styles.btn}>
        {/* <Button title="Test Printer" onPress={printreciept} /> */}
        <ButtonPaper
          onPress={printreciept}
          mode="contained"
          buttonColor={theme.colors.secondary}>
          Test Printer
        </ButtonPaper>
      </View>
    </View>
  )
}

export default SamplePrint

const styles = StyleSheet.create({
  btn: {
    marginBottom: 8,
  },
})
