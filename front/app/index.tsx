import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { globalStyles } from "./globalStyles";
import { BASE_URL } from "@/config";
import { useRouter } from "expo-router";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_email: email,
          password: password,
        }),
      });

      const text = await res.text(); // 👈 safer
      console.log("RAW RESPONSE:", text);

      const data = JSON.parse(text);

      if (res.ok) {
        console.log("LOGIN SUCCESS:", data);

        if (!data.token) {
          throw new Error("No token received");
        }

        await AsyncStorage.setItem("token", data.token);

        if (data.user) {
          await AsyncStorage.setItem("user", JSON.stringify(data.user));
        }

        router.push("/(tabs)/sos");
      } else {
        Alert.alert("Error", data.message || "Login failed");
      }
    } catch (err: any) {
      console.log("LOGIN ERROR:", err);
      Alert.alert("Error", err.message || "Server connection failed");
    }
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Login</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#8B949E"
        style={globalStyles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#8B949E"
        secureTextEntry
        style={globalStyles.input}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={globalStyles.button} onPress={handleLogin}>
        <Text style={globalStyles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/register")}>
        <Text style={globalStyles.linkText}>
          Don't have an account? Register
        </Text>
      </TouchableOpacity>
    </View>
  );
}
