import { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { bleManager } from "../../src/core/ble/bleManager";
import { startBLEServer } from "../../src/core/ble/nativeServer";

export default function Ble() {
  const [devices, setDevices] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const [ready, setReady] = useState(false);

  // Initialization
  useEffect(() => {
    const init = async () => {
      try {
        await bleManager.initializeBLE();
        startBLEServer(); // Start ble server
        setReady(true);
        console.log("BLE Ready");
      } catch (error) {
        console.log("Init Error:", error);
      }
    };

    init();
  }, []);

  // 🔍 Start scanning
  const startScan = () => {
    if (!ready) {
      console.log("BLE not ready yet");
      return;
    }

    setDevices([]);

    bleManager.startScan((device) => {
      setDevices((prev) => {
        if (!prev.find((d) => d.id === device.id)) {
          return [...prev, device];
        }
        return prev;
      });
    });
  };

  // 🔗 Connect
  const connect = async (id: string) => {
    try {
      await bleManager.connectToDevice(id);
      setConnected(true);

      bleManager.listenForMessages((msg) => {
        console.log("Received in UI:", msg);
      });
    } catch (error) {
      console.log("Connect error:", error);
    }
  };

  // 📤 Send message
  const send = () => {
    bleManager.sendMessage("HELLO_DEVICE");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BLE Test</Text>

      <Button title="Scan Devices" onPress={startScan} />

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.device}
            onPress={() => connect(item.id)}
          >
            <Text>{item.name || "Unnamed Device"}</Text>
            <Text style={styles.id}>{item.id}</Text>
          </TouchableOpacity>
        )}
      />

      {connected && <Button title="Send Message" onPress={send} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  device: {
    padding: 10,
    borderBottomWidth: 1,
    width: 300,
  },
  id: {
    fontSize: 10,
    color: "gray",
  },
});
