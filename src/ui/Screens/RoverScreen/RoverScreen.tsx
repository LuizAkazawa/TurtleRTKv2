import React from 'react';
import {Checkbox} from 'react-native-paper';
import {PermissionsAndroid, View, Text, StyleSheet} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {observer} from 'mobx-react-lite';
import {useStoreContext} from '../../../fc/Store';
import ErrorPopUp, {ErrorType} from './BLE/ErrorPopUp';
import HeaderRoverScreen from './BLE/HeaderRoverScreen';
import PeripheralList from './BLE/PeripheralList';

interface RoverScreenProps {
  navigation;
}

export async function requestBluetoothScanPermission() {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Bluetooth Scan permission granted');
    } else {
      console.log('Bluetooth Scan permission denied');
    }
  } catch (err) {
    console.warn(err);
  }
}

export async function requestBluetoothConnectPermission() {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Bluetooth connexion permission granted');
    } else {
      console.log('Bluetooth connextion permission denied');
    }
  } catch (err) {
    console.warn(err);
  }
}


export default observer(function RoverScreen({navigation}: RoverScreenProps) {

  React.useEffect(() => {
    return navigation.addListener('focus', async () => {
      await requestBluetoothScanPermission();
      await requestBluetoothConnectPermission();
      store.bluetoothManager.initialize();
      await store.logManager.handleRecordingDirectory();
    });
  }, []);

  const store = useStoreContext();

  return (
    <SafeAreaView style={styles.container}>
      <HeaderRoverScreen />
      <ErrorPopUp
        error={ErrorType.BLUETOOTH}
        title={'Bluetooth deactivated'}
        desc={'Please enable bluetooth for scanning peripherals.'}
      />
      <ErrorPopUp
        error={ErrorType.LOCALISATION}
        title={'Localisation deactivated'}
        desc={'Please enable localisation for scanning peripherals.'}
      />
      <PeripheralList navigation={navigation} />
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  sortButton: {
    flexDirection: 'row',
    backgroundColor: '#151515',
    padding: 10,
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
