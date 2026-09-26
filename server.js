const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ⚠️ Service Account يجب أن يكون في Environment Variables على Render
// للتطوير المحلي: ضع المفاتيح في ملف .env
const SERVICE_ACCOUNT = process.env.SERVICE_ACCOUNT_JSON 
  ? JSON.parse(process.env.SERVICE_ACCOUNT_JSON)
  : null;

if (!SERVICE_ACCOUNT) {
  console.error('❌ خطأ: SERVICE_ACCOUNT_JSON غير موجود في Environment Variables');
  console.error('📝 يرجى إضافة SERVICE_ACCOUNT_JSON في إعدادات Render');
  process.exit(1);
}

const PROJECT_ID = SERVICE_ACCOUNT.project_id;
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
    console.log('🔔 بدء إرسال إشعار FCM');
    console.log('📱 Token:', fcmToken.substring(0, 30) + '...');
    console.log('📌 Title:', title);
    console.log('📝 Body:', body);

    const accessToken = await getAccessToken();
    console.log('✅ تم الحصول على Access Token');

    const url = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;
    
    const message = {
      message: {
        token: fcmToken,
        notification: {
          title: title,
          body: body
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        android: {
          priority: 'HIGH',
          notification: {
            channel_id: 'orders_channel',
            sound: 'default',
            priority: 'high',
            default_sound: true,
            default_vibrate_timings: true,
            notification_count: 1
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              content_available: true,
              alert: {
                title: title,
                body: body
              }
            }
          },
          headers: {
            'apns-priority': '10'
          }
        }
      }
    };

    console.log('📤 إرسال الطلب إلى FCM...');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(message)
    });

    const responseData = await response.json();
    console.log('📊 Status Code:', response.status);
    console.log('📄 Response:', JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log('✅ تم إرسال الإشعار بنجاح');
      return { success: true, data: responseData };
    } else {
      console.log('❌ فشل إرسال الإشعار');
      return { success: false, error: responseData };
    }
  } catch (error) {
    console.error('❌ خطأ:', error);
    return { success: false, error: error.message };
  }
}

// ===== API Routes =====

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'FCM Notification Server is running! 🚀',
    endpoints: {
      'POST /send-notification': 'Send notification to single device',
      'POST /send-bulk-notification': 'Send notification to multiple devices'
    }
  });
});

// Send notification to single device
app.post('/send-notification', async (req, res) => {
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
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send notification to multiple devices
app.post('/send-bulk-notification', async (req, res) => {
  try {
    const { fcmTokens, title, body, data } = req.body;

    if (!fcmTokens || !Array.isArray(fcmTokens) || fcmTokens.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'fcmTokens must be a non-empty array'
      });
    }

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, body'
      });
    }

    console.log(`📤 إرسال ${fcmTokens.length} إشعار...`);

    const results = await Promise.all(
      fcmTokens.map(token => sendFCMNotification(token, title, body, data))
    );

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    console.log(`✅ نجح: ${successCount}, ❌ فشل: ${failureCount}`);

    res.json({
      success: true,
      total: results.length,
      successful: successCount,
      failed: failureCount,
      results: results
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 FCM Notification Server`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`✅ Server is ready!`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});
