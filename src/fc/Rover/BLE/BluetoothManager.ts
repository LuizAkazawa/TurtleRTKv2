import BleManager, { PeripheralInfo } from 'react-native-ble-manager';
import { makeAutoObservable, runInAction } from 'mobx';
import { AppStore } from '../../Store';

export class bluetoothManager {
  peripherals: Array<any> = [];
  peripheral: PeripheralInfo | null = null;
  isScanning: boolean = false;
  displayNoNameDevices: boolean = false;
  outputData: String[] = [];
  parentStore: AppStore | null = null;
  listeners: any[] = [];

  setDisplayNoNameDevices(state: boolean) {
    this.displayNoNameDevices = state;
  }

  // ------- For ErrorPopUp -------
  isBluetoothActivated: boolean = false;
  displayBluetoothActivatedError: boolean = false;
  isLocalisationActivated: boolean = false;
  displayLocalisationActivatedError: boolean = false;
  setIsBluetoothActivated(state: boolean) {
    this.isBluetoothActivated = state;
  }
  setDisplayBluetoothActivatedError(state: boolean) {
    this.displayBluetoothActivatedError = state;
  }
  setIsLocalisationActivated(state: boolean) {
    this.isLocalisationActivated = state;
  }
  setDisplayLocalisationActivatedError(state: boolean) {
    this.displayLocalisationActivatedError = state;
  }
  // ------- ------- ------- -------

  constructor(parentStore: AppStore) {
    this.parentStore = parentStore;
    makeAutoObservable(this, {
      listeners: false,
      registerListeners: false,
    });
    BleManager.start({showAlert: false}).then(() => {
      console.log('Module initialized');
      this.registerListeners();
    });
  }

  registerListeners() {
    this.listeners = [
      BleManager.onDiscoverPeripheral(
        this.handleDiscoverPeripheral.bind(this),
      ),
      BleManager.onStopScan(
        this.handleStopScan.bind(this),
      ),
      BleManager.onDisconnectPeripheral(
        this.handleDisconnectedPeripheral.bind(this),
      ),
      BleManager.onDidUpdateValueForCharacteristic(
        this.readNotification.bind(this),
      ),
    ];
    console.log('Listeners registered');
  }

  clearOutput() {
    this.outputData = [];
  }

  getPeripherals() {
    return this.peripherals;
  }

  getPeripheral(peripheralId: string) {
    for (let i = 0; i < this.peripherals.length; i++) {
      if (this.peripherals[i].id === peripheralId) {
        return this.peripherals[i];
      }
    }
    return null;
  }

  setPeripheral(peripheral: PeripheralInfo) {
    for (let i = 0; i < this.peripherals.length; i++) {
      if (this.peripherals[i].id === peripheral.id) {
        this.peripherals[i] = peripheral;
        return;
      }
    }
    this.peripherals.push(peripheral);
  }

  async scanDevices() {
    runInAction(() => {
      this.peripherals = [];
      this.isScanning = true;
    });
    try {
      console.log('Scanning...');
      await BleManager.scan({
        serviceUUIDs: [],
        seconds: 5,
        allowDuplicates: false,
      });
      console.log('Scan started successfully');
    } catch (error) {
      console.error('Scan error:', error);
      runInAction(() => {
        this.isScanning = false;
      });
    }
  }

  handleStopScan() {
    console.log('handleStopScan called');
    runInAction(() => {
      this.isScanning = false;
    });
    console.log('Scan is stopped');
  }

  handleDisconnectedPeripheral(data: any) {
    runInAction(() => {
      let peripheral = this.getPeripheral(data.peripheral.id);
      if (peripheral) {
        this.setPeripheral(peripheral);
      }
      console.log('Disconnected from ' + peripheral);
    });
  }

  handleDiscoverPeripheral(peripheral: any) {
    console.log('Discovered peripheral:', peripheral.id, peripheral.name);
    runInAction(() => {
      this.setPeripheral(peripheral);
    });
  }

  togglePeripheralConnection(peripheral: any) {
    if (peripheral && peripheral.connected) {
      BleManager.disconnect(peripheral.id);
      runInAction(() => {
        this.setPeripheral({
          ...peripheral,
          ...{connecting: false, connected: false, error: false},
        });
      });
    } else {
      this.connectPeripheral(peripheral);
    }
  }

  connectPeripheral(peripheral: any) {
    try {
      if (peripheral) {
        runInAction(() => {
          this.setPeripheral({
            ...peripheral,
            ...{connecting: true, connected: false, error: false},
          });
        });
        BleManager.connect(peripheral.id)
          .then(() =>
            runInAction(() => {
              this.setPeripheral({
                ...peripheral,
                ...{connecting: false, connected: true, error: false},
              });
            }),
          )
          .catch(() => {
            runInAction(() => {
              this.setPeripheral({
                ...peripheral,
                ...{connecting: false, connected: false, error: true},
              });
            });
          });
      }
    } catch (error) {
      console.log('Connection error', error);
      runInAction(() => {
        this.setPeripheral({
          ...peripheral,
          ...{connecting: false, connected: false},
        });
      });
    }
  }

  isSending: boolean = false;

  startCommunication(
    data: any,
    peripheralID: string,
    serviceUUIDs?: string[] | undefined,
  ) {
    BleManager.retrieveServices(peripheralID, serviceUUIDs)
      .then(peripheralInfo => {
        runInAction(() => {
          this.setPeripheral({...peripheralInfo, ...{connected: true}});
          this.peripheral = peripheralInfo;
          if (!peripheralInfo.characteristics) {
            this.parentStore?.errorManager.printError(
              'Error in peripheral characteristics',
            );
            return;
          }
          peripheralInfo.characteristics.forEach(element => {
            if (!peripheralInfo.advertising.serviceUUIDs) {
              this.parentStore?.errorManager.printError(
                'Error in peripheral service UUIDs',
              );
              return;
            }
            if (element.properties.Write && !this.isSending) {
              this.isSending = true;
              this.write(
                peripheralInfo.id,
                peripheralInfo.advertising.serviceUUIDs![0],
                element.characteristic,
                data,
              );
            }
          });
        });
      })
      .catch(() => {
        runInAction(() => {
          this.parentStore?.errorManager.printError(
            'Error in peripheral retrieving services',
          );
        });
      });
  }

  startNotification(peripheralID: string, serviceUUID: string) {
    if (!this.peripheral || !this.peripheral.characteristics) {
      return;
    }
    BleManager.requestMTU(peripheralID, 512)
      .then(mtu => {
        console.log('MTU size changed to ' + mtu + ' bytes');
      })
      .catch(error => {
        console.log(error);
      });
    this.peripheral.characteristics.forEach(element => {
      if (!this.peripheral || !this.peripheral.advertising.serviceUUIDs) {
        return;
      }
      if (element.properties.Read) {
        BleManager.startNotification(
          peripheralID,
          serviceUUID,
          element.characteristic,
        ).catch(() => {});
      }
    });
  }

  stopNotification() {
    if (
      this.peripheral != null &&
      this.peripheral.characteristics !== undefined
    ) {
      this.peripheral.characteristics.forEach(element => {
        if (
          this.peripheral != null &&
          !this.peripheral.advertising.serviceUUIDs
        ) {
          this.parentStore?.errorManager.printError(
            'Error in peripheral service UUIDs',
          );
          return;
        }
        if (
          this.peripheral != null &&
          this.peripheral.advertising.serviceUUIDs != null &&
          element.properties.Write &&
          !this.isSending
        ) {
          this.isSending = true;
          BleManager.stopNotification(
            this.peripheral.id,
            this.peripheral.advertising.serviceUUIDs[0],
            element.characteristic,
          );
        }
      });
    }
  }

  readNotification(event: any) {
    let buff = String.fromCharCode(...event.value);
    console.log('Received ' + buff);
    runInAction(() => {
      this.outputData.push(buff);
    });
  }

  write(
    peripheralID: string,
    serviceUUID: string,
    characteristicUUID: string,
    data: any,
    maxByteSize?: number | undefined,
  ) {
    const buffer = Buffer.from(data);
    BleManager.write(
      peripheralID,
      serviceUUID,
      characteristicUUID,
      buffer.toJSON().data,
      maxByteSize,
    )
      .then(() => {
        runInAction(() => {
          this.isSending = false;
          this.startNotification(peripheralID, serviceUUID);
        });
      })
      .catch(() => {
        runInAction(() => {
          this.isSending = false;
          this.parentStore?.errorManager.printError(
            'Error while writing to peripheral',
          );
        });
      });
  }

  sendInformations(data: any) {
    for (let i = 0; i < this.peripherals.length; i++) {
      if (this.peripherals[i].connected) {
        const peripheral: PeripheralInfo = this.peripherals[i];
        this.startCommunication(data, peripheral.id);
      }
    }
  }
}