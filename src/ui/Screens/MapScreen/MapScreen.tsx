import React from 'react';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { LeafletView } from 'react-native-leaflet-view';

const DEFAULT_LOCATION = {
  latitude: -23.5489,
  longitude: -46.6388
};

const App: React.FC = () => {
    const [position, setPosition] = useState({
        lat: global.myLatitude,
        lng: global.myLongitude,
        initialized: global.isPositionInitialized
      });
  useEffect(() => {
      const interval = setInterval(() => {
        setPosition({
          lat: global.myLatitude,
          lng: global.myLongitude,
          initialized: global.isPositionInitialized
        });
      }, 1000);

      return () => clearInterval(interval);
    }, []);
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
      markers={position.initialized ? [
                {
                  id: '1',
                  position: { lat: position.lat, lng: position.lng },
                  icon: '📍',
                },
              ] : []}
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