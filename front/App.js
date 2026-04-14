import CONFIG from "./config";

const loginUser = async () => {
  try {
    const response = await fetch(`${CONFIG.BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_email: "john@example.com",
        password: "password123",
      }),
    });

    const data = await response.json();
  } catch (err) {
    console.error("Login error:", err.message);
  }
};
