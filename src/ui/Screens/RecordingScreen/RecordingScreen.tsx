import {observer} from 'mobx-react-lite';
import React, {useState} from 'react';
import {Button} from 'react-native-paper';
import {PermissionsAndroid, View, Text, StyleSheet, ScrollView} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {useStoreContext} from '../../../fc/Store';

interface Props {
  navigation: any;
}

const convertNMEAToDecimal = (nmeaPos: string, direction: string): number => {
  if (!nmeaPos || !direction) return 0;

  const dotIndex = nmeaPos.indexOf('.');
  const degreesStr = nmeaPos.substring(0, dotIndex - 2);
  const minutesStr = nmeaPos.substring(dotIndex - 2);

  const degrees = parseFloat(degreesStr);
  const minutes = parseFloat(minutesStr);

  let decimal = degrees + minutes / 60;

  if (direction === 'S' || direction === 'W') {
    decimal = decimal * -1;
  }

  return decimal;
};

export default observer(function RecordingScreen({navigation}: Props) {

  const store = useStoreContext();

  const [isRunning, setRunning] = useState(false);
  const [buttonText, setButtonText] = useState('Run');

  const HeaderButton = () => {
    navigation.navigate('LogScreen');
  };

const getLatLon = (sentence: string) => {
  const parts = sentence.split(',');
  if (parts.length < 6) return 'Invalid data';
  return parts.slice(2, 6).join(','); // lat, latDir, lon, lonDir are always at 2,3,4,5
};

const dataLoc = store.bluetoothManager.outputData
  .filter(item => item.toString().includes('$GNGGA'))
  .pop() 
  ?.toString();

const lastLatLon = dataLoc ? getLatLon(dataLoc) : 'No data';

if (dataLoc) {
  const parts = dataLoc.split(',');

  if (parts.length >= 6 && parts[2] !== '' && parts[4] !== '') {
    const finalLat = convertNMEAToDecimal(parts[2], parts[3]);
    const finalLon = convertNMEAToDecimal(parts[4], parts[5]);

    // Mise à jour des globales pour MapScreen.tsx
    global.myLatitude = finalLat;
    global.myLongitude = finalLon;
    global.isPositionInitialized = true;

    console.log(`Position mise à jour : ${finalLat}, ${finalLon}`);
  }
}
  const renderHeaderTab = () => {
    return (
      <View style={styles.headerTab}>
        <Text
          style={{
            marginLeft: 15,
            fontSize: 18,
            fontWeight: 'bold',
            color: 'white',
          }}>
          Recording Screen
        </Text>
        <Button onPress={HeaderButton}>View Logs</Button>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeaderTab()}
      <View>
        <View style={{marginHorizontal: 20}}>
          <Button
            style={{marginVertical: 10}}
            mode="contained"
            onPress={() => {
              if (isRunning) {
                store.bluetoothManager.stopNotification();
                store.logManager.write(
                  store.bluetoothManager.outputData.toString(),
                );
                store.casterConnection.closeConnection();
                store.casterConnection.clear();
                store.bluetoothManager.clearOutput();
                setRunning(false);
                setButtonText('Run');
              } else {
                if (store.casterConnection.connectedBase !== null) {
                  setRunning(true);
                  setButtonText('Pause');
                  store.casterConnection.getNTRIPData();
                } else {
                  store.errorManager.printError(
                    'Select a base before running.',
                  );
                }
              }
            }}>
            {buttonText}
          </Button>

          <Text
            style={{
              fontStyle: 'italic',
              fontSize: 15,
              color: 'white',
              padding: 15,
            }}>
            {'RTCM messsages received from caster : '}
            {store.casterConnection.inputData.length}
          </Text>
          <Text
            style={{
              fontStyle: 'italic',
              fontSize: 15,
              color: 'white',
              padding: 15,
            }}>
            {'NMEA messages received from rover : '}
            {store.bluetoothManager.outputData.length}
          </Text>
        </View>
        <ScrollView>
          <Text style={{fontStyle: 'italic', fontSize: 15, color: 'white', padding: 15}}>
            {lastLatLon ?? 'No data'}
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  modal: {
    margin: 0,
  },
  item: {
    backgroundColor: '#3F4141',
    padding: 12,
    marginVertical: 2,
    marginHorizontal: 10,
    borderRadius: 20,
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  header: {
    fontSize: 25,
    color: 'white',
    marginLeft: 15,
    paddingTop: 20,
    paddingBottom: 5,
  },

  title: {
    marginHorizontal: 10,
    fontSize: 20,
    color: 'white',
  },
  sortButton: {
    flex: 1,
    backgroundColor: '#151515',
    padding: 10,
    marginHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    alignItems: 'center',
  },
  dropdown: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  textinput: {
    margin: 10,
  },
  TabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  headerTab: {
    backgroundColor: '#111111',
    justifyContent: 'space-between',
    flexDirection: 'row',
    borderBottomColor: '#151515',
    borderBottomWidth: 1,
    height: 50,
    alignItems: 'center',
  },
});
