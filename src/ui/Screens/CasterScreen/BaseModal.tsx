import Modal from 'react-native-modal';
import {ScrollView, Text, View} from 'react-native';
import {Chip, Text as PaperText} from 'react-native-paper';
import React from 'react';
import {styles} from './CasterScreen';
import Base from '../../../fc/Caster/Base';

interface BaseModalProps {
  selectedBase: Base;
  isInfoVisible: boolean;
  toogleInfo;
}

export default function BaseModal({
  selectedBase,
  isInfoVisible,
  toogleInfo,
}: BaseModalProps) {
  const base = selectedBase;
  return (
    <Modal
      style={styles.modal}
      useNativeDriver={true}
      isVisible={isInfoVisible}
      onBackButtonPress={toogleInfo}
      onSwipeComplete={toogleInfo}
      animationIn="slideInUp"
      animationOut="slideOutDown">
      <View style={styles.headerTab}>
        <Text
          style={{
            marginLeft: 15,
            fontSize: 18,
            fontWeight: 'bold',
            color: 'white',
          }}>
          {base.mountpoint}
        </Text>
      </View>
      <View style={styles.container}>
        <ScrollView>
          <View
            style={{
              justifyContent: 'space-between',
              flexDirection: 'row',
            }}
          />
          <View style={styles.container}>
            <View style={styles.chipsContainer}>
              <Chip style={styles.chip} icon="dns">
                Identifier : {base.identifier}
              </Chip>
              <Chip style={styles.chip} icon="account-key">
                Authentification : {base.authentification}
              </Chip>
              <Chip style={styles.chip} icon="arrow-u-left-top-bold">
                VRS : {String(String(base.nmea))}
              </Chip>
              <Chip style={styles.chip} icon="earth">
                Country : {base.country}
              </Chip>
              <Chip style={styles.chip} icon="wallet">
                Fee : {String(base.fee)}
              </Chip>
              <Chip style={styles.chip} icon="vector-triangle">
                Network of base : {String(base.solution)}
              </Chip>
              <Chip style={styles.chip} icon="human-queue">
                Network : {base.network}
              </Chip>
            </View>
            <View style={styles.baseText}>
              <PaperText variant="bodyMedium" style={styles.baseText}>
                Position : {base.latitude}, {base.longitude}
              </PaperText>
              <PaperText variant="bodyMedium" style={styles.baseText}>
                Bitrate : {base.bitrate} bits per second
              </PaperText>
              <PaperText variant="bodyMedium" style={styles.baseText}>
                Network : {base.network}
              </PaperText>
              <PaperText variant="bodyMedium" style={styles.baseText}>
                Format : {base.format + ' (' + base.formatDetails + ')'}
              </PaperText>
              <PaperText variant="bodyMedium" style={styles.baseText}>
                Carrier : {base.carrier}
              </PaperText>
              <PaperText variant="bodyMedium" style={styles.baseText}>
                NavSystem : {base.navSystem}
              </PaperText>
              <PaperText variant="bodyMedium" style={styles.baseText}>
                Compression : {base.compression}
              </PaperText>
              <PaperText variant="bodyMedium" style={styles.baseText}>Misc : {base.misc}</PaperText>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
