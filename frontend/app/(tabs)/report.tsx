// reports.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { globalStyles } from "../globalStyles";

export default function Reports() {
  const [incidentType, setIncidentType] = useState("");
  const [severity, setSeverity] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("Your home");

  const handleSubmit = () => {
    console.log({
      incidentType,
      severity,
      description,
      location,
    });
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Submit Report</Text>

      <Text style={globalStyles.label}>Incident Type</Text>
      <TextInput
        style={globalStyles.input}
        value={incidentType}
        onChangeText={setIncidentType}
        placeholder="Incident type"
      />

      <Text style={globalStyles.label}>Severity</Text>
      <TextInput
        style={globalStyles.input}
        value={severity}
        onChangeText={setSeverity}
        placeholder="Severity"
      />

      <Text style={globalStyles.label}>Description</Text>
      <TextInput
        style={globalStyles.input}
        multiline
        value={description}
        onChangeText={setDescription}
        placeholder="Describe incident"
      />

      <Text style={globalStyles.label}>Location</Text>
      <TextInput
        style={globalStyles.input}
        value={location}
        onChangeText={setLocation}
      />

      {/* Photo upload placeholder */}
      <TouchableOpacity style={globalStyles.button}>
        <Text style={globalStyles.buttonText}>Upload Photo</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[globalStyles.button, globalStyles.buttonAccent]}
        onPress={handleSubmit}
      >
        <Text style={globalStyles.buttonText}>Submit Report</Text>
      </TouchableOpacity>
    </View>
  );
}
