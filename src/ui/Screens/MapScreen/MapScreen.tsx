import React from 'react';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { LeafletView } from 'react-native-leaflet-view';

const DEFAULT_LOCATION = {
  latitude: -23.5489,
  longitude: -46.6388
};

const App: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <LeafletView
        // Centrage de la carte
        mapCenterPosition={{
          lat: DEFAULT_LOCATION.latitude,
          lng: DEFAULT_LOCATION.longitude,
        }}
        zoom={15}  // Niveau de zoom
        doDebug={false} // Pour s'assurer que la carte occupe tout l'espace
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Prend tout l'écran
    backgroundColor: '#fff',
  },
});

export default App;