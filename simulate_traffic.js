const BASE_URL = "http://localhost:3001/api";

async function post(endpoint, data) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response.json();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function simulateTraffic() {
    console.log("🚦 Starting Live Traffic Simulation for Frontend Testing...");
    console.log("Press Ctrl+C to stop.\n");

    let userCount = 0;

    while (true) {
        try {
            // Generate a random 6-digit user ID
            const userId = Math.floor(100000 + Math.random() * 900000);
            
            // 1. SIGNUP
            console.log(`[+] Signing up new user: ${userId}`);
            await post("/signup", { userId });
            
            // Wait 2 seconds so you can see the user pop up on the right sidebar
            await sleep(2000);
            
            // Generate a random payment amount between ₹10 and ₹150
            const amount = Math.floor(10 + Math.random() * 140);
            
            // 2. PAYMENT
            console.log(`[₹] Processing payment of ₹${amount} for user ${userId}`);
            await post("/pay", { userId, amount });
            
            userCount++;
            
            // Wait 3 seconds before next user simulation
            await sleep(3000);

        } catch (error) {
            console.error("Simulation error:", error.message);
            console.log("Retrying in 5 seconds...");
            await sleep(5000);
        }
    }
}

simulateTraffic();
