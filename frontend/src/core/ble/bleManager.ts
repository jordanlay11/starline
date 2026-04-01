import {
  BleManager,
  Device,
  Characteristic,
  BleError,
} from "react-native-ble-plx";
import { Buffer } from "buffer";
import { PermissionsAndroid, Platform } from "react-native";
import { SERVICE_UUID, CHARACTERISTIC_UUID } from "./bleConstants";

const manager = new BleManager();
global.Buffer = global.Buffer || Buffer;

class BLEManagerService {
  devices: Device[] = [];
  connectedDevice: Device | null = null;

  // 🔐 Request permissions properly
  async requestPermissions() {
    if (Platform.OS === "android") {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);

      console.log("Permissions:", result);

      const allGranted = Object.values(result).every(
        (res) => res === PermissionsAndroid.RESULTS.GRANTED,
      );

      if (!allGranted) {
        throw new Error("Permissions not granted");
      }
    }
  }

  // 🔵 Wait for Bluetooth to be ON
  async waitForBluetooth() {
    return new Promise<void>((resolve) => {
      const subscription = manager.onStateChange((state) => {
        console.log("Bluetooth State:", state);

        if (state === "PoweredOn") {
          subscription.remove();
          resolve();
        }
      }, true);
    });
  }

  // 🚀 Initialize BLE safely
  async initializeBLE() {
    await this.requestPermissions();
    await this.waitForBluetooth();
    console.log("BLE Initialized");
  }

  // 🔍 Scan for devices
  startScan(onDeviceFound: (device: Device) => void) {
    console.log("Starting scan...");

    manager.stopDeviceScan(); // prevent multiple scans

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log("Scan warning:", error.message);
        return;
      }

      if (device) {
        // Avoid duplicates
        const exists = this.devices.find((d) => d.id === device.id);
        if (!exists) {
          this.devices.push(device);

          onDeviceFound(device);
        }
      }
    });
  }

  stopScan() {
    console.log("Stopping scan...");
    manager.stopDeviceScan();
  }

  // 🔗 Connect to device
  async connectToDevice(deviceId: string) {
    try {
      console.log("Connecting to:", deviceId);

      const device = await manager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();

      this.connectedDevice = device;

      console.log("Connected to:", device.name);

      return device;
    } catch (error) {
      console.log("Connection error:", error);
      throw error;
    }
  }

  // 📤 Send message
  async sendMessage(message: string) {
    if (!this.connectedDevice) {
      console.log("No device connected");
      return;
    }

    try {
      const base64Message = Buffer.from(message).toString("base64");

      await this.connectedDevice.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        base64Message,
      );

      console.log("Message sent:", message);
    } catch (error) {
      console.log("Send error:", error);
    }
  }

  // 📥 Listen for incoming messages
  async listenForMessages(callback: (msg: string) => void) {
    if (!this.connectedDevice) return;

    this.connectedDevice.monitorCharacteristicForService(
      SERVICE_UUID,
      CHARACTERISTIC_UUID,
      (error: BleError | null, characteristic: Characteristic | null) => {
        if (error) {
          console.log("BLE Error:", error);
          return;
        }

        if (characteristic?.value) {
          const decoded = Buffer.from(characteristic.value, "base64").toString(
            "utf-8",
          );

          console.log("Received:", decoded);
          callback(decoded);
        }
      },
    );
  }
}

export const bleManager = new BLEManagerService();
