// register.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { globalStyles } from "./globalStyles";
import { useRouter } from "expo-router";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = () => {
    console.log("Register:", name, email, password);
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Register</Text>

      <TextInput
        placeholder="Full Name"
        placeholderTextColor="#8B949E"
        style={globalStyles.input}
        value={name}
        onChangeText={setName}
      />

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

      <TouchableOpacity
        style={[globalStyles.button, globalStyles.buttonAccent]}
        onPress={handleRegister}
      >
        <Text style={globalStyles.buttonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/login")}>
        <Text style={globalStyles.linkText}>
          Already have an account? Login
        </Text>
      </TouchableOpacity>
    </View>
  );
}
