import React, { useState, useEffect } from 'react';
import { StyleSheet} from 'react-native';
import { LeafletView } from 'react-native-leaflet-view';
import '../../../../global';
import { SafeAreaView } from 'react-native-safe-area-context';

const App: React.FC = () => {
  const [mapCenter, setMapCenter] = useState({
    lat: 45.184357,
    lng: 5.753735,
  });
  const [position, setPosition] = useState({
    lat: global.myLatitude,
    lng: global.myLongitude,
    initialized: global.isPositionInitialized
  });

  useEffect(() => {
    //console.log("État global au démarrage :", global.myLatitude, global.myLongitude);

    const interval = setInterval(() => {
      if (global.myLatitude !== position.lat) {
        //console.log("Changement détecté ! Nouvelle Lat :", global.myLatitude);
        setPosition({
          lat: global.myLatitude,
          lng: global.myLongitude,
          initialized: global.isPositionInitialized
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [position.lat]);

  return (
    <SafeAreaView style={styles.container}>

<LeafletView
  mapCenterPosition={mapCenter}
  zoom={12}
  doDebug={false}
  mapMarkers={
    position.initialized
      ? [
          {
            id: '1',
            position: {
              lat: position.lat,
              lng: position.lng,
            },
            icon: '🔴',
            size: [16, 16],
          },
        ]
      : []
  }
/>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default App;