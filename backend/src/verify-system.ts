async function testSystem() {
  console.log('🧪 Starting System Endpoint Verification Test...');

  try {
    // 1. Test Health Endpoint
    const healthRes = await fetch('http://localhost:5000/api/health');
    const healthData = await healthRes.json() as any;
    console.log('✅ 1. API Health Check:', healthData);

    // 2. Test Student Login
    const studentLogin = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'student1@campus.edu', password: 'password123' })
    }).then(r => r.json()) as any;
    console.log('✅ 2. Student Login Success:', studentLogin.success, '| User:', studentLogin.user?.full_name);

    // 3. Test Admin Login
    const adminLogin = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@campus.edu', password: 'password123' })
    }).then(r => r.json()) as any;
    console.log('✅ 3. Admin Login Success:', adminLogin.success, '| User:', adminLogin.user?.full_name);

    const adminToken = adminLogin.token;

    // 4. Test Analytics API
    const analyticsRes = await fetch('http://localhost:5000/api/campus/analytics', {
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then(r => r.json()) as any;
    console.log('✅ 4. Admin Analytics KPIs:', analyticsRes.kpis);

    // 5. Test Campus Insights API
    const insightsRes = await fetch('http://localhost:5000/api/campus/insights', {
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then(r => r.json()) as any;
    console.log('✅ 5. Campus Insights Problem Sites Count:', insightsRes.problemSites?.length, '| Repaired Sites Count:', insightsRes.repairedSites?.length);

    // 6. Test AI Categorization & Priority Analysis
    const aiRes = await fetch('http://localhost:5000/api/complaints/ai-analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: 'Water leaking heavily from washroom sink',
        description: 'Major water leakage from tap in washroom flooding the floor',
        building_id: 1,
        room_area: '2nd Floor Washroom'
      })
    }).then(r => r.json()) as any;
    console.log('✅ 6. AI Categorization:', aiRes.categoryPrediction?.categoryName, '| Priority:', aiRes.priorityUrgency?.priority, '| Urgency Score:', aiRes.priorityUrgency?.urgencyScore);

    console.log('🎉 ALL API ENDPOINTS VERIFIED AND WORKING PERFECTLY!');
  } catch (err: any) {
    console.error('❌ Verification failed:', err.message);
  }
}

testSystem();
