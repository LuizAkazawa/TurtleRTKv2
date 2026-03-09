import Modal from 'react-native-modal';
import RNFS from 'react-native-fs';
import {ScrollView, Text, View} from 'react-native';
import {Button, Chip} from 'react-native-paper';
import React from 'react';
import {styles} from '../CasterScreen/CasterScreen';
import {observer} from 'mobx-react-lite';
import {useStoreContext} from '../../../fc/Store';

interface LogModalProps {
  selectedLog: string;
  isLogVisible: boolean;
  modifyLogVisibility;
}

// Method to export Log to GPX, making the logs understandable by OpenStreetMap
const exportLogToGPX = async (fileName, rawContent) => {
  // we separate the lines and only keep the GGA lines
  const lines = rawContent.split('\n');
  const ggaLines = lines.filter(l => l.includes('GGA'));


  // gpx header initialisation
  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TurtleRTKv2" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${fileName}</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>RTK Trace</name>
    <trkseg>`;

  // convertion of each line into GPX
  ggaLines.forEach(line => {
    try {
      const parts = line.split(',');
      const latRaw = parts[2]; //NMEA latitude
      const latDir = parts[3]; //north or south
      const lonRaw = parts[4]; //NMEA longitude
      const lonDir = parts[5]; //east or west
      const alt = parts[9];  //altitude (in meters)

      if (latRaw && lonRaw) {
        // method for conversion from NMEA to decimal
        const toDec = (nmea, dir) => {
          const d = parseFloat(nmea.substring(0, nmea.indexOf('.') - 2));
          const m = parseFloat(nmea.substring(nmea.indexOf('.') - 2));
          let res = d + m / 60;
          return dir === 'S' || dir === 'W' ? -res : res;
        };
        //latitude and longitude conversion
        const lat = toDec(latRaw, latDir);
        const lon = toDec(lonRaw, lonDir);

        gpx += `
      <trkpt lat="${lat.toFixed(8)}" lon="${lon.toFixed(8)}">
        <ele>${alt}</ele>
      </trkpt>`;
      }
    } catch (e) { /* ignoring the bad format lines */ }
  });

  //end of the gpx file
  gpx += `
    </trkseg>
  </trk>
</gpx>`;

  // saving the file
  const gpxFileName = fileName.replace('.txt', '').replace('.ubx', '') + '.gpx';
  const path = `${RNFS.DownloadDirectoryPath}/${gpxFileName}`;

  try {
    await RNFS.writeFile(path, gpx, 'utf8');
    alert(`File exported :\n${path}`);
  } catch (err) {
    alert("Error during the export : " + err.message);
  }
};

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
                              onPress={() => {
                                const fileName = store.logManager.getFileName(store.logManager.currentFile.infos?.path);
                                const content = store.logManager.getClearContent();
                                exportLogToGPX(fileName, content);
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
