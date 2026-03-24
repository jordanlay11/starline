// login.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { globalStyles } from "./globalStyles";
import { useRouter } from "expo-router";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    router.push("/(tabs)/sos");
    console.log("Login:", email, password);
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
