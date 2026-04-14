export function sendSOS() {
  const message = {
    type: "SOS",
    userId: "123",
    timestamp: Date.now(),
    location: null, // add later
  };

  console.log("SOS created:", message);
}
