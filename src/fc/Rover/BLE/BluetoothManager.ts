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
  isSending: boolean = false;
  private outputBuffer: string[] = [];
  private outputFlushInterval: ReturnType<typeof setInterval> | null = null;
  private peripheralBuffer: any[] = [];
  private scanFlushInterval: ReturnType<typeof setInterval> | null = null;
  private notificationPeripheralID: string | null = null;
  private notificationServiceUUID: string | null = null;
  isNotifying: boolean = false;

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
      isNotifying: false,
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
    this.outputBuffer = [];
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

    this.peripheralBuffer = [];
    this.scanFlushInterval = setInterval(() => {
      if (this.peripheralBuffer.length > 0) {
        runInAction(() => {
          this.peripherals.push(...this.peripheralBuffer);
          this.peripheralBuffer = [];
        });
      }
    }, 500);

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
    if (this.scanFlushInterval) {
      clearInterval(this.scanFlushInterval);
      if (this.peripheralBuffer.length > 0) {
        runInAction(() => {
          this.peripherals.push(...this.peripheralBuffer);
          this.peripheralBuffer = [];
        });
      }
      this.scanFlushInterval = null;
    }
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
    const existsInList = this.peripherals.some(p => p.id === peripheral.id);
    const existsInBuffer = this.peripheralBuffer.some(p => p.id === peripheral.id);
    if (!existsInList && !existsInBuffer) {
      this.peripheralBuffer.push(peripheral);
    }
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
    if (!this.isNotifying) {
      console.log('startNotification blocked');
      return;
    }
    if (!this.peripheral || !this.peripheral.characteristics) {
      return;
    }

    this.notificationPeripheralID = peripheralID;
    this.notificationServiceUUID = serviceUUID;

    // Clear any existing interval before starting a new one
    if (this.outputFlushInterval) {
      clearInterval(this.outputFlushInterval);
    }

    this.outputFlushInterval = setInterval(() => {
      if (this.outputBuffer.length > 0) {
        runInAction(() => {
          this.outputData.push(...this.outputBuffer);
          this.outputBuffer = [];
        });
      }
    }, 500);

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
      if (element.properties.Notify) {
        BleManager.startNotification(
          peripheralID,
          serviceUUID,
          element.characteristic,
        ).catch(() => {});
      }
    });
  }

  stopNotification() {
    this.isNotifying = false;
    /*
    // DEBUG PRINTS
    console.log('stopNotification called');
    console.log('peripheral:', this.peripheral?.id);
    console.log('characteristics:', this.peripheral?.characteristics?.length);
    console.log('notificationPeripheralID:', this.notificationPeripheralID);
    console.log('notificationServiceUUID:', this.notificationServiceUUID);
    */

    if (this.outputFlushInterval) {
      clearInterval(this.outputFlushInterval);
      this.outputFlushInterval = null;
    }
    this.outputBuffer = [];

    if (
      this.peripheral == null ||
      this.peripheral.characteristics === undefined ||
      this.notificationPeripheralID == null ||
      this.notificationServiceUUID == null
    ) {
      console.log('stopNotification returning early - missing data');
      return;
    }

    this.peripheral.characteristics.forEach(element => {
      console.log('characteristic:', element.characteristic, 'Notify:', element.properties.Notify);
      if (element.properties.Notify) {
        console.log('Stopping notification for:', element.characteristic);
        BleManager.stopNotification(
          this.notificationPeripheralID!,
          this.notificationServiceUUID!,
          element.characteristic,
        ).then(() => {
          console.log('Successfully stopped notification for:', element.characteristic);
        }).catch((err) => {
          console.log('Failed to stop notification for:', element.characteristic, err);
        });
      }
    });

    this.notificationPeripheralID = null;
    this.notificationServiceUUID = null;
  }

  readNotification(event: any) {
    let buff = String.fromCharCode(...event.value);
    this.outputBuffer.push(buff);
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
          if(this.isNotifying){
            this.startNotification(peripheralID, serviceUUID);
          }
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
  
  startRecording() {
    this.isNotifying = true;
  }

  sendInformations(data: any) { // WORK ON THIS 
    for (let i = 0; i < this.peripherals.length; i++) {
      if (this.peripherals[i].connected) {
        const peripheral: PeripheralInfo = this.peripherals[i];
        this.startCommunication(data, peripheral.id);
      }
    }
  }
}