
const axios = require('axios');

const payload = {
    formData: {
        projectName: "Test Project",
        authors: "Test Author",
        organization: "Test Org",
        problemStatement: "Test Problem",
        targetUsers: ["User"],
        appType: "Web",
        domain: "E-commerce",
        coreFeatures: "Feature 1",
        userFlow: "Flow 1",
        userScale: "< 100 Users",
        performance: "Standard",
        authRequired: "Yes",
        sensitiveData: "No",
        compliance: [],
        backendPref: "No Preference",
        dbPref: "No Preference",
        deploymentPref: "No Preference",
        detailLevel: "Professional"
    },
    projectId: null,
    mode: "quick"
};

async function testNodeGeneration() {
    try {
        console.log("Sending request to Node backend...");
        const response = await axios.post('http://localhost:5000/api/projects/enterprise/generate', payload, {
            headers: {
                'Content-Type': 'application/json',
                'x-debug-bypass': 'true'
            }
        });
        console.log("Response Success:", response.data);
    } catch (err) {
        console.error("Response Error:", err.response ? err.response.data : err.message);
    }
}

testNodeGeneration();
