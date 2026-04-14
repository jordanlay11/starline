// sos.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { globalStyles } from "../globalStyles";
import * as Location from "expo-location";
import { sendSOS } from "@/src/backend/sos/sosService";

export default function SOS() {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const handleSOS = () => {
    sendSOS();
  };

  return (
    <View style={globalStyles.container}>
      <TouchableOpacity style={globalStyles.sosButton} onPress={handleSOS}>
        <Text style={globalStyles.sosText}>SOS</Text>
      </TouchableOpacity>

      <View style={globalStyles.card}>
        <Text style={globalStyles.label}>Your Location:</Text>
        <Text>location not set</Text>
      </View>
    </View>
  );
}
