const { google } = require('googleapis');

// Service Account من Environment Variables
const SERVICE_ACCOUNT = process.env.SERVICE_ACCOUNT_JSON 
  ? JSON.parse(process.env.SERVICE_ACCOUNT_JSON)
  : null;

if (!SERVICE_ACCOUNT) {
  console.error('❌ SERVICE_ACCOUNT_JSON غير موجود');
}

const PROJECT_ID = SERVICE_ACCOUNT?.project_id || 'abtalelshwar3';
const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

// Get Access Token
async function getAccessToken() {
  const jwtClient = new google.auth.JWT(
    SERVICE_ACCOUNT.client_email,
    null,
    SERVICE_ACCOUNT.private_key,
    [FCM_SCOPE],
    null
  );

  const tokens = await jwtClient.authorize();
  return tokens.access_token;
}

// Send FCM Notification
async function sendFCMNotification(fcmToken, title, body, data = {}) {
  try {
    console.log('🔔 إرسال إشعار FCM');
    
    const accessToken = await getAccessToken();
    const url = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;
    
    const message = {
      message: {
        token: fcmToken,
        notification: { title, body },
        data: { ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
        android: {
          priority: 'HIGH',
          notification: {
            channel_id: 'orders_channel',
            sound: 'default'
          }
        }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(message)
    });

    const responseData = await response.json();
    
    return {
      success: response.ok,
      data: response.ok ? responseData : null,
      error: response.ok ? null : responseData
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Vercel Serverless Function Handler
module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fcmToken, title, body, data } = req.body;

    if (!fcmToken || !title || !body) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fcmToken, title, body'
      });
    }

    const result = await sendFCMNotification(fcmToken, title, body, data);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
