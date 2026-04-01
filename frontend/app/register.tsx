import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { globalStyles } from "./globalStyles";
import { BASE_URL } from "@/config";
import { useRouter } from "expo-router";

export default function Register({ navigation }: any) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_name: name,
          user_email: email,
          password: password,
          phone_num: phone,
        }),
      });

      const data = await res.json();

      if (res.status === 201) {
        Alert.alert("Success", data.message);
        router.push("/");
      } else {
        Alert.alert("Error", data.message || "Registration failed");
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Could not connect to server");
    }
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
        placeholder="Phone Number"
        placeholderTextColor="#8B949E"
        style={globalStyles.input}
        value={phone}
        onChangeText={setPhone}
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
    </View>
  );
}
