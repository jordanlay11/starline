import { NativeModules } from "react-native";

const { BLEServer } = NativeModules;

export const startBLEServer = () => {
  if (!BLEServer) {
    console.log("BLEServer not found");
    return;
  }

  BLEServer.startServer();
};
