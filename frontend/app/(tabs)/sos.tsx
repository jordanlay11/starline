// sos.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { globalStyles } from "../globalStyles";

export default function SOS() {
  const [location, setLocation] = useState("Fetching location...");

  const handleSOS = () => {
    console.log("SOS triggered!");
    // later: send alert + GPS
  };

  return (
    <View style={globalStyles.container}>
      <TouchableOpacity style={globalStyles.sosButton} onPress={handleSOS}>
        <Text style={globalStyles.sosText}>SOS</Text>
      </TouchableOpacity>

      <View style={globalStyles.card}>
        <Text style={globalStyles.label}>Your Location:</Text>
        <Text>{location}</Text>
      </View>
    </View>
  );
}
