import { StyleSheet } from "react-native";

export const colors = {
  background: "#0D1117",
  primary: "#1F6FEB",
  accent: "#2EA043",
  warning: "#F0883E",
  danger: "#D73A49",
  textPrimary: "#C9D1D9",
  textMuted: "#8B949E",
};

export const globalStyles = StyleSheet.create({
  //Login and Register
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: 20,
  },

  title: {
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: "center",
  },

  input: {
    borderWidth: 1,
    borderColor: colors.textMuted,
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    color: colors.textPrimary,
  },

  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },

  buttonAccent: {
    backgroundColor: colors.accent,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  linkText: {
    color: colors.primary,
    textAlign: "center",
    marginTop: 10,
  },

  // Tabs

  sosButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.danger,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 30,
  },

  sosText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },

  card: {
    borderWidth: 1,
    borderColor: colors.textMuted,
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },

  label: {
    color: colors.textPrimary,
    marginBottom: 5,
  },
});
