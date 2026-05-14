const BASE_URL = "http://localhost:3001/api";

async function post(endpoint, data) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return {
        status: response.status,
        data: await response.json()
    };
}

async function get(endpoint) {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    return {
        status: response.status,
        data: await response.json()
    };
}

async function testAPI() {
    console.log("🚀 Starting Comprehensive Backend API Tests...\n");
    const testUserId = Math.floor(Math.random() * 1000000); // Random ID to avoid collision

    try {
        // --- SIGNUP TESTS ---
        console.log("--- 📝 SIGNUP TESTS ---");
        
        // 1. Success Signup
        console.log("Test 1: New User Signup...");
        const s1 = await post("/signup", { userId: testUserId });
        console.log(`Result: ${s1.data.success ? '✅' : '❌'} - ${s1.data.message}`);

        // 2. Duplicate Signup
        console.log("Test 2: Duplicate User Signup...");
        const s2 = await post("/signup", { userId: testUserId });
        console.log(`Result: ${s2.data.success ? '✅ (Expected)' : '❌'} - ${s2.data.message}`);


        // --- PAYMENT TESTS ---
        console.log("\n--- 💸 PAYMENT TESTS ---");

        // 3. Success Payment
        console.log(`Test 3: Valid Payment (User ${testUserId}, Amount 100)...`);
        const p1 = await post("/pay", { userId: testUserId, amount: 100 });
        console.log(`Result: ${p1.data.success ? '✅' : '❌'} - ${p1.data.message}`);

        // 4. Insufficient Balance
        console.log("Test 4: Insufficient Balance (Amount 2000)...");
        const p2 = await post("/pay", { userId: testUserId, amount: 2000 });
        console.log(`Result: ${!p2.data.success ? '✅ (Expected Failure)' : '❌'} - ${p2.data.message}`);

        // 5. Non-existent User
        console.log("Test 5: Payment with Non-existent User (ID 9999999)...");
        const p3 = await post("/pay", { userId: 9999999, amount: 50 });
        console.log(`Result: ${!p3.data.success ? '✅ (Expected Failure)' : '❌'} - ${p3.data.message}`);

        // --- DEPOSIT TESTS ---
        console.log("\n--- 💰 DEPOSIT TESTS ---");

        // 6. Success Deposit
        console.log(`Test 6: Add Funds (User ${testUserId}, Amount 500)...`);
        const d1 = await post("/add-funds", { userId: testUserId, amount: 500 });
        console.log(`Result: ${d1.data.success ? '✅' : '❌'} - ${d1.data.message} (New Balance: ${d1.data.balance})`);

        // --- BALANCE TESTS ---
        console.log("\n--- ⚖️ BALANCE TESTS ---");

        // 7. Get User Balance
        console.log(`Test 7: Fetch User Balance (User ${testUserId})...`);
        const b1 = await get(`/balance/${testUserId}`);
        console.log(`Result: ${b1.data.success ? '✅' : '❌'} - Balance: ${b1.data.balance}`);

        // 8. Get Vendor Balance
        console.log("Test 8: Fetch Vendor Balance...");
        const b2 = await get("/vendor-balance");
        console.log(`Result: ${b2.data.success ? '✅' : '❌'} - Vendor Balance: ${b2.data.balance}`);

        // --- ERROR HANDLING ---
        console.log("\n--- ⚠️ ERROR HANDLING ---");

        // 9. Missing Fields
        console.log("Test 9: Missing Fields (Pay without amount)...");
        const e1 = await post("/pay", { userId: testUserId });
        // The controller doesn't explicitly check for amount existence before math, might return 500 or logic fail
        console.log(`Result: Status ${e1.status}, Msg: ${JSON.stringify(e1.data)}`);


        console.log("\n✨ All tests completed!");
    } catch (error) {
        console.error("\n❌ Test Suite Crashed:", error.message);
        console.log("Make sure your server is running on http://localhost:3001");
    }
}

testAPI();
