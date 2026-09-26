# 🔔 FCM Notification Server

Backend مجاني 100% لإرسال إشعارات FCM للتطبيقات Flutter.

## 🚀 الرفع على Render.com (مجاني)

### الخطوات:

1. **إنشاء حساب على Render.com:**
   - اذهب إلى: https://render.com/
   - سجّل دخول بـ GitHub

2. **رفع الكود على GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

3. **إنشاء Web Service على Render:**
   - اذهب إلى: https://dashboard.render.com/
   - اضغط "New +" → "Web Service"
   - اختر GitHub Repository
   - الإعدادات:
     - **Name:** fcm-notification-server
     - **Environment:** Node
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
     - **Plan:** Free

4. **انتظر Deploy (2-3 دقائق)**

5. **احصل على URL:**
   ```
   https://fcm-notification-server-XXXX.onrender.com
   ```

## 📡 API Endpoints

### 1. إرسال إشعار لجهاز واحد

**POST** `/send-notification`

```json
{
  "fcmToken": "ccdNTQvyQpqdTGI66_b3C9:APA91bF...",
  "title": "🚨 طلب جديد!",
  "body": "لديك طلب جديد في انتظار قبولك",
  "data": {
    "orderId": "ORD123456",
    "type": "new_order"
  }
}
```

### 2. إرسال إشعار لعدة أجهزة

**POST** `/send-bulk-notification`

```json
{
  "fcmTokens": [
    "token1...",
    "token2...",
    "token3..."
  ],
  "title": "🚨 طلب جديد!",
  "body": "لديك طلب جديد",
  "data": {
    "orderId": "ORD123456"
  }
}
```

## 🧪 اختبار محلي

```bash
cd notification_backend
npm install
npm start
```

ثم افتح: http://localhost:3000

## 🔐 الأمان

⚠️ **ملاحظة:** service_account.json موجود في الكود للتطوير فقط.

للإنتاج، استخدم Environment Variables على Render:
- اذهب إلى Dashboard → Environment
- أضف المتغيرات من service_account.json

## 📱 التكامل مع Flutter

استبدل `fcm_sender_service.dart` بـ HTTP request:

```dart
final response = await http.post(
  Uri.parse('https://YOUR-RENDER-URL.onrender.com/send-notification'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'fcmToken': token,
    'title': '🚨 طلب جديد!',
    'body': 'لديك طلب جديد',
    'data': {'orderId': orderId}
  }),
);
```

## 💰 التكلفة

✅ **مجاني 100%** على Render.com Free Plan:
- 750 ساعة/شهر
- 512 MB RAM
- يكفي للتطبيقات الصغيرة والمتوسطة

⚠️ **تنويه:** السيرفر ينام بعد 15 دقيقة من عدم الاستخدام (يستيقظ تلقائياً عند أول request).
