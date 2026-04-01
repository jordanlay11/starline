import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as Location from "expo-location";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "@/config";

const REPORT_TYPES = [
  "TRAPPED_PERSON",
  "INJURY",
  "FLOODING",
  "BLOCKED_ROAD",
  "STRUCTURAL_DAMAGE",
  "MISSING_PERSON",
  "OTHER",
];

const URGENCY_LEVELS = ["LOW", "MEDIUM", "HIGH"];

const URGENCY_COLORS: Record<string, string> = {
  LOW: "#00e676",
  MEDIUM: "#ffaa00",
  HIGH: "#ff4444",
};

export default function ReportScreen({ navigation }: any) {
  const router = useRouter();
  const [report_type, setReportType] = useState("");
  const [description, setDescription] = useState("");
  const [urgency_level, setUrgency] = useState("");
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [address, setAddress] = useState("Fetching location...");
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(true);

  // ─────────────────────────────────────────
  // Get GPS location on screen load
  // ─────────────────────────────────────────
  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to submit a report.",
        );
        setLocLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      // Reverse geocode using Nominatim
      const geoResponse = await axios.get(
        "https://nominatim.openstreetmap.org/reverse",
        {
          params: {
            lat: loc.coords.latitude,
            lon: loc.coords.longitude,
            format: "json",
          },
          headers: {
            "User-Agent": "HurricaneAlertJA/1.0",
          },
        },
      );

      setAddress(geoResponse.data.display_name || "Unknown Location");
    } catch (err: any) {
      console.error("Location error:", err.message);
      setAddress("Unable to fetch location");
    } finally {
      setLocLoading(false);
    }
  };

  // ─────────────────────────────────────────
  // Submit the report to the backend
  // ─────────────────────────────────────────
  const handleSubmit = async () => {
    if (!report_type) {
      Alert.alert("Error", "Please select a report type.");
      return;
    }

    if (!urgency_level) {
      Alert.alert("Error", "Please select an urgency level.");
      return;
    }

    if (!location) {
      Alert.alert("Error", "Location is required.");
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Error", "Session expired. Please login again.");
        router.replace("/sos");
        return;
      }

      const res = await fetch(`${BASE_URL}/api/reports/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          report_type,
          description,
          latitude: location.latitude,
          longitude: location.longitude,
          urgency_level,
          sent_mode: "INTERNET",
        }),
      });

      const text = await res.text(); // safer than res.json()
      console.log("RAW RESPONSE:", text);

      const data = JSON.parse(text);

      if (res.ok) {
        Alert.alert("Success", data.message || "Report submitted", [
          {
            text: "OK",
            onPress: () => router.push("/(tabs)/sos"),
          },
        ]);
      } else {
        Alert.alert("Error", data.error || "Failed to submit report.");
      }
    } catch (err: any) {
      console.log("FETCH ERROR:", err);
      Alert.alert("Error", "Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Report</Text>
      </View>

      <View style={styles.inner}>
        {/* ── Location Box ── */}
        <View style={styles.locationBox}>
          <Text style={styles.locationLabel}>📍 Your Current Location</Text>
          {locLoading ? (
            <ActivityIndicator color="#00c8ff" size="small" />
          ) : (
            <>
              <Text style={styles.locationAddress}>{address}</Text>
              {location && (
                <Text style={styles.locationCoords}>
                  {location.latitude.toFixed(6)},{" "}
                  {location.longitude.toFixed(6)}
                </Text>
              )}
            </>
          )}
          <TouchableOpacity onPress={getLocation} style={styles.refreshBtn}>
            <Text style={styles.refreshText}>↻ Refresh Location</Text>
          </TouchableOpacity>
        </View>

        {/* ── Report Type ── */}
        <Text style={styles.label}>Report Type *</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
        >
          {REPORT_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.chip, report_type === type && styles.chipSelected]}
              onPress={() => setReportType(type)}
            >
              <Text
                style={[
                  styles.chipText,
                  report_type === type && styles.chipTextSelected,
                ]}
              >
                {type.replace(/_/g, " ")}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Urgency Level ── */}
        <Text style={styles.label}>Urgency Level *</Text>
        <View style={styles.urgencyRow}>
          {URGENCY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.urgencyBtn,
                urgency_level === level && {
                  backgroundColor: URGENCY_COLORS[level] + "22",
                  borderColor: URGENCY_COLORS[level],
                },
              ]}
              onPress={() => setUrgency(level)}
            >
              <Text
                style={[
                  styles.urgencyText,
                  urgency_level === level && {
                    color: URGENCY_COLORS[level],
                  },
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Description ── */}
        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Describe the incident in detail..."
          placeholderTextColor="#555"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        {/* ── Transmission Mode ── */}
        <View style={styles.modeBox}>
          <Text style={styles.modeLabel}>📡 Transmission Mode</Text>
          <Text style={styles.modeValue}>🌐 Internet</Text>
        </View>

        {/* ── Submit Button ── */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (!report_type || !urgency_level || !location) &&
              styles.submitDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading || !report_type || !urgency_level || !location}
        >
          {loading ? (
            <ActivityIndicator color="#0a0e1a" />
          ) : (
            <Text style={styles.submitText}>Submit Report</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.requiredNote}>* Required fields</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0e1a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#0d1420",
    borderBottomWidth: 1,
    borderBottomColor: "#1e2d45",
    gap: 12,
  },
  backBtn: {
    color: "#00c8ff",
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  inner: {
    padding: 20,
  },
  locationBox: {
    backgroundColor: "#1a2235",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1e2d45",
    marginBottom: 20,
  },
  locationLabel: {
    color: "#888",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  locationAddress: {
    color: "#cdd6f4",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  locationCoords: {
    color: "#00c8ff",
    fontSize: 12,
    fontFamily: "monospace",
    marginBottom: 10,
  },
  refreshBtn: {
    alignSelf: "flex-start",
  },
  refreshText: {
    color: "#00c8ff",
    fontSize: 13,
  },
  label: {
    color: "#888",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 16,
  },
  chipScroll: {
    marginBottom: 4,
  },
  chip: {
    backgroundColor: "#1a2235",
    borderWidth: 1,
    borderColor: "#1e2d45",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: "#00c8ff22",
    borderColor: "#00c8ff",
  },
  chipText: {
    color: "#555",
    fontSize: 13,
  },
  chipTextSelected: {
    color: "#00c8ff",
    fontWeight: "bold",
  },
  urgencyRow: {
    flexDirection: "row",
    gap: 8,
  },
  urgencyBtn: {
    flex: 1,
    backgroundColor: "#1a2235",
    borderWidth: 1,
    borderColor: "#1e2d45",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  urgencyText: {
    color: "#555",
    fontWeight: "bold",
    fontSize: 13,
  },
  input: {
    backgroundColor: "#1a2235",
    borderWidth: 1,
    borderColor: "#1e2d45",
    borderRadius: 10,
    padding: 14,
    color: "#fff",
    fontSize: 14,
    minHeight: 120,
    marginTop: 4,
  },
  modeBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a2235",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1e2d45",
    marginTop: 20,
    marginBottom: 8,
  },
  modeLabel: {
    color: "#888",
    fontSize: 13,
  },
  modeValue: {
    color: "#00c8ff",
    fontSize: 13,
    fontWeight: "bold",
  },
  submitBtn: {
    backgroundColor: "#00c8ff",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  submitDisabled: {
    backgroundColor: "#1a2235",
    borderWidth: 1,
    borderColor: "#1e2d45",
  },
  submitText: {
    color: "#0a0e1a",
    fontWeight: "bold",
    fontSize: 16,
  },
  requiredNote: {
    color: "#555",
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 40,
  },
});

{
  /* 
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { globalStyles } from "../globalStyles";
import { BASE_URL } from "@/config";

export default function Reports() {
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState<any>(null);

  //pick image
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  //submit report
  const handleSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const [latitude, longitude] = location.split(",");

      // STEP 1: CREATE REPORT
      const res = await fetch(`${BASE_URL}/api/reports/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          report_type: type,
          description,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          urgency_level: urgency,
          sent_mode: "manual",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.error || "Failed to submit report");
        return;
      }

      const reportID = data.report.reportid || data.report.reportID;

      // STEP 2: UPLOAD PHOTO (if exists)
      if (image) {
        const formData = new FormData();

        formData.append("photo", {
          uri: image.uri,
          name: "photo.jpg",
          type: "image/jpeg",
        } as any);

        await fetch(`${BASE_URL}/api/reports/photo/${reportID}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // ❗ DO NOT set Content-Type manually
          },
          body: formData,
        });
      }

      Alert.alert("Success", "Report submitted successfully");

      // reset form
      setType("");
      setDescription("");
      setUrgency("");
      setLocation("");
      setImage(null);
    } catch (err) {
      console.log("REPORT ERROR:", err);
      Alert.alert("Error", "Submission failed");
    }
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Submit Report</Text>

      <TextInput
        placeholder="Incident Type"
        placeholderTextColor="#8B949E"
        style={globalStyles.input}
        value={type}
        onChangeText={setType}
      />

      <TextInput
        placeholder="Urgency Level (LOW, MEDIUM, HIGH)"
        placeholderTextColor="#8B949E"
        style={globalStyles.input}
        value={urgency}
        onChangeText={setUrgency}
      />

      <TextInput
        placeholder="Description"
        placeholderTextColor="#8B949E"
        style={globalStyles.input}
        multiline
        value={description}
        onChangeText={setDescription}
      />

      <TextInput
        placeholder="Location (lat,lng)"
        placeholderTextColor="#8B949E"
        style={globalStyles.input}
        value={location}
        onChangeText={setLocation}
      />

      <TouchableOpacity style={globalStyles.button} onPress={pickImage}>
        <Text style={globalStyles.buttonText}>
          {image ? "Change Photo" : "Upload Photo"}
        </Text>
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
*/
}
