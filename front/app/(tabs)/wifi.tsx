import { useState } from "react";
import { Button, ScrollView, Text, TextInput, View } from "react-native";
import {
  broadcastMessage,
  connectToServer,
  startServer,
} from "../../src/core/network/wifiServices";

export default function WifiScreen() {
  const [ip, setIp] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  const addMessage = (msg: string) => {
    setMessages((prev) => [...prev, msg]);
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "gray" }}>
      <Button
        title="Start Server"
        onPress={() => {
          console.log("🟢 Starting server...");
          startServer(addMessage);
        }}
      />

      <TextInput
        placeholder="Enter IP to connect"
        value={ip}
        onChangeText={setIp}
        style={{ borderWidth: 1, marginVertical: 10, padding: 5 }}
      />

      <Button
        title="Connect"
        onPress={() => {
          console.log("🔗 Connecting to:", ip);
          connectToServer(ip);
        }}
      />

      <TextInput
        placeholder="Message"
        value={message}
        onChangeText={setMessage}
        style={{ borderWidth: 1, marginVertical: 10, padding: 5 }}
      />

      <Button
        title="Send"
        onPress={() => {
          broadcastMessage(message);
          addMessage("Me: " + message);
        }}
      />

      <ScrollView style={{ marginTop: 20 }}>
        {messages.map((msg, index) => (
          <Text key={index} style={{ marginBottom: 5 }}>
            {msg}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}
