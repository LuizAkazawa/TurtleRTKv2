import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, Text } from 'react-native';
import { LeafletView } from 'react-native-leaflet-view';
import '../../../../global'; // ASSURE-TOI QUE LE CHEMIN EST BON

const App: React.FC = () => {
  const [position, setPosition] = useState({
    lat: global.myLatitude,
    lng: global.myLongitude,
    initialized: global.isPositionInitialized
  });

  useEffect(() => {
    console.log("État global au démarrage :", global.myLatitude, global.myLongitude);

    const interval = setInterval(() => {
      if (global.myLatitude !== position.lat) {
        console.log("Changement détecté ! Nouvelle Lat :", global.myLatitude);
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
      {/* Petit indicateur visuel pour debug sans la carte */}
      <Text style={{position: 'absolute', top: 50, zIndex: 10, backgroundColor: 'white'}}>
        Debug : {position.lat} / {position.lng}
      </Text>

<LeafletView
  mapCenterPosition={{
    lat: position.lat || 48.8566,
    lng: position.lng || 2.3522,
  }}
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
            icon: '📍',
            size: [32, 32],
          },
        ]
      : []  // ← tableau vide = aucun marker
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