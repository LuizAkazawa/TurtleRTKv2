import Modal from 'react-native-modal';
import RNFS from 'react-native-fs';
import {ScrollView, Text, View} from 'react-native';
import {Button, Chip} from 'react-native-paper';
import React from 'react';
import {styles} from '../CasterScreen/CasterScreen';
import {observer} from 'mobx-react-lite';
import {useStoreContext} from '../../../fc/Store';
import { decode } from '../../../fc/Caster/NTRIP/nmea/nmea.js';
import { exportLogToGPX } from '../../../fc/log/log';


interface LogModalProps {
  selectedLog: string;
  isLogVisible: boolean;
  modifyLogVisibility;
}


export default observer(function LogModal({
  selectedLog,
  isLogVisible,
  modifyLogVisibility,
}: LogModalProps) {
  const store = useStoreContext();
  return (
    <Modal
      style={styles.modal}
      useNativeDriver={true}
      isVisible={isLogVisible}
      onBackButtonPress={() => modifyLogVisibility(false)}
      animationIn="slideInUp"
      animationOut="slideOutDown">
      <View style={styles.headerTab}>
        {store.logManager.currentFile.infos !== undefined && (
          <Text
            style={{
              marginLeft: 15,
              fontSize: 18,
              fontWeight: 'bold',
              color: 'white',
            }}>
            {store.logManager.getFileName(
              store.logManager.currentFile.infos?.path,
            )}
          </Text>
        )}
      </View>
      <View style={styles.container}>
        <View
          style={{
            justifyContent: 'space-between',
            flexDirection: 'row',
          }}
        />
        <View style={styles.container}>
          {store.logManager.currentFile.infos !== undefined && (
            <View style={styles.chipsContainer}>
              <Chip style={styles.chip} icon="dns">
                Path: {store.logManager.currentFile.infos?.path}
              </Chip>
              <Chip style={styles.chip} icon="dns">
                Modif: {store.logManager.currentFile.infos?.mtime.toString()}
              </Chip>
              <Chip style={styles.chip} icon="dns">
                Size: {store.logManager.currentFile.infos?.size}
              </Chip>
            </View>
          )}
                          <View style={{ padding: 10, flexDirection: 'row', justifyContent: 'center' }}>
                            <Button
                              icon="map-export"
                              mode="contained"
                              buttonColor="#27ae60" // green
                              onPress={async () => {
                                const fileName = store.logManager.getFileName(store.logManager.currentFile.infos?.path);
                                const content = store.logManager.getClearContent();
                                await exportLogToGPX(fileName, content);
                              }}
                            >
                              Export to GPX (OSM)
                            </Button>
                          </View>
          <ScrollView style={{padding: 20}}>
            <Text style={{color: 'white'}}>
              {store.logManager.getClearContent()}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});
