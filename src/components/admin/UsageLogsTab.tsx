import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import * as XLSX from 'xlsx';

// Types
interface WebSession {
    id: string;
    sessionId: string;
    userId: string;
    userName: string;
    device: string;
    browser: string;
    currentPage: string;
    lastSeen: string;
    lastSeenMs: number;
    date: string;
    isLive?: boolean;
}

interface AppSession {
    id: string;
    sessionId: string;
    userId: string;
    userName: string;
    platform: string;
    appVersion: string;
    deviceModel: string;
    osVersion: string;
    currentScreen: string;
    action: string;
    ipAddress?: string;
    lastSeen: string;
    lastSeenMs: number;
    date: string;
}

interface UsageLogsTabProps {
    addToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const UsageLogsTab: React.FC<UsageLogsTabProps> = ({ addToast }) => {
    // Top-level screen selection
    const [activeScreen, setActiveScreen] = useState<'website' | 'app'>('website');

    // Period filters: 'now' | 'today' | 'week' | 'month'
    const [webPeriod, setWebPeriod] = useState<'now' | 'today' | 'week' | 'month'>('now');
    const [appPeriod, setAppPeriod] = useState<'now' | 'today' | 'week' | 'month'>('now');

    // Live Web Sessions and Historical Logs
    const [webSessions, setWebSessions] = useState<WebSession[]>([]);
    const [webHistoryLogs, setWebHistoryLogs] = useState<any[]>([]);

    // Live App Sessions and Historical Logs
    const [appSessions, setAppSessions] = useState<AppSession[]>([]);
    const [appHistoryLogs, setAppHistoryLogs] = useState<any[]>([]);

    // API Key State for App Developer
    const [appApiKey, setAppApiKey] = useState<string>(() => {
        return localStorage.getItem('cinematix_app_api_key') || 'cinematix_mobile_app_sec_key_2026';
    });
    const [showApiKey, setShowApiKey] = useState<boolean>(false);
    const [selectedCodeSnippet, setSelectedCodeSnippet] = useState<'kotlin' | 'flutter' | 'react-native' | 'swift' | 'curl'>('kotlin');

    // API Live Tester State
    const [testDevice, setTestDevice] = useState('Samsung Galaxy S24 Ultra');
    const [testOs, setTestOs] = useState('Android 14');
    const [testAppVersion, setTestAppVersion] = useState('2.4.0');
    const [testScreen, setTestScreen] = useState('Watch: Film Al-Ikhwa');
    const [testUserId, setTestUserId] = useState('user_dev_88');
    const [testResponse, setTestResponse] = useState<any>(null);
    const [isTestingApi, setIsTestingApi] = useState(false);

    // Web Report Generator Modal State
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportDateFrom, setReportDateFrom] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    });
    const [reportDateTo, setReportDateTo] = useState(() => new Date().toISOString().split('T')[0]);

    // Search / Filter inputs
    const [webSearchQuery, setWebSearchQuery] = useState('');
    const [appSearchQuery, setAppSearchQuery] = useState('');

    // Real-time listener for Web Active Sessions
    useEffect(() => {
        const unsubscribe = db.collection('web_active_sessions').onSnapshot((snapshot) => {
            const list: WebSession[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as WebSession));
            
            // Sort by lastSeenMs descending
            list.sort((a, b) => (b.lastSeenMs || 0) - (a.lastSeenMs || 0));
            setWebSessions(list);
        }, (err) => {
            console.warn("Error listening to web_active_sessions:", err);
        });

        return () => unsubscribe();
    }, []);

    // Fetch Web History Logs
    useEffect(() => {
        const fetchWebLogs = async () => {
            try {
                const snap = await db.collection('web_usage_logs').limit(200).get();
                const logs = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
                logs.sort((a: any, b: any) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
                setWebHistoryLogs(logs);
            } catch (e) {
                console.warn("Error fetching web_usage_logs:", e);
            }
        };
        fetchWebLogs();
    }, []);

    // Real-time listener for App Active Sessions
    useEffect(() => {
        const unsubscribe = db.collection('app_active_sessions').onSnapshot((snapshot) => {
            const list: AppSession[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as AppSession));

            list.sort((a, b) => (b.lastSeenMs || 0) - (a.lastSeenMs || 0));
            setAppSessions(list);
        }, (err) => {
            console.warn("Error listening to app_active_sessions:", err);
        });

        return () => unsubscribe();
    }, []);

    // Fetch App History Logs
    useEffect(() => {
        const fetchAppLogs = async () => {
            try {
                const snap = await db.collection('app_usage_logs').limit(200).get();
                const logs = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
                logs.sort((a: any, b: any) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
                setAppHistoryLogs(logs);
            } catch (e) {
                console.warn("Error fetching app_usage_logs:", e);
            }
        };
        fetchAppLogs();
    }, []);

    // Calculate Active Web Users (Online within 3 minutes)
    const liveWebUsers = useMemo(() => {
        const threeMinsAgo = Date.now() - 3 * 60 * 1000;
        return webSessions.filter(s => (s.lastSeenMs || 0) >= threeMinsAgo);
    }, [webSessions]);

    // Calculate Active App Users (Online within 3 minutes)
    const liveAppUsers = useMemo(() => {
        const threeMinsAgo = Date.now() - 3 * 60 * 1000;
        return appSessions.filter(s => (s.lastSeenMs || 0) >= threeMinsAgo);
    }, [appSessions]);

    // Web Stats by selected period
    const filteredWebSessions = useMemo(() => {
        const nowMs = Date.now();
        let cutoffMs = 0;

        if (webPeriod === 'now') cutoffMs = nowMs - 3 * 60 * 1000;
        else if (webPeriod === 'today') cutoffMs = new Date().setHours(0, 0, 0, 0);
        else if (webPeriod === 'week') cutoffMs = nowMs - 7 * 24 * 60 * 60 * 1000;
        else if (webPeriod === 'month') cutoffMs = nowMs - 30 * 24 * 60 * 60 * 1000;

        let items = webSessions.filter(s => (s.lastSeenMs || 0) >= cutoffMs);
        if (webSearchQuery.trim()) {
            const q = webSearchQuery.toLowerCase();
            items = items.filter(s => 
                (s.userName && s.userName.toLowerCase().includes(q)) ||
                (s.currentPage && s.currentPage.toLowerCase().includes(q)) ||
                (s.device && s.device.toLowerCase().includes(q)) ||
                (s.browser && s.browser.toLowerCase().includes(q))
            );
        }
        return items;
    }, [webSessions, webPeriod, webSearchQuery]);

    // App Stats by selected period
    const filteredAppSessions = useMemo(() => {
        const nowMs = Date.now();
        let cutoffMs = 0;

        if (appPeriod === 'now') cutoffMs = nowMs - 3 * 60 * 1000;
        else if (appPeriod === 'today') cutoffMs = new Date().setHours(0, 0, 0, 0);
        else if (appPeriod === 'week') cutoffMs = nowMs - 7 * 24 * 60 * 60 * 1000;
        else if (appPeriod === 'month') cutoffMs = nowMs - 30 * 24 * 60 * 60 * 1000;

        let items = appSessions.filter(s => (s.lastSeenMs || 0) >= cutoffMs);
        if (appSearchQuery.trim()) {
            const q = appSearchQuery.toLowerCase();
            items = items.filter(s => 
                (s.userName && s.userName.toLowerCase().includes(q)) ||
                (s.deviceModel && s.deviceModel.toLowerCase().includes(q)) ||
                (s.currentScreen && s.currentScreen.toLowerCase().includes(q)) ||
                (s.appVersion && s.appVersion.toLowerCase().includes(q))
            );
        }
        return items;
    }, [appSessions, appPeriod, appSearchQuery]);

    // Web Device breakdown
    const webDeviceStats = useMemo(() => {
        const stats: Record<string, number> = {};
        webSessions.forEach(s => {
            const d = s.device || 'غير معروف';
            stats[d] = (stats[d] || 0) + 1;
        });
        return Object.entries(stats).sort((a, b) => b[1] - a[1]);
    }, [webSessions]);

    // Web Top Pages breakdown
    const webTopPages = useMemo(() => {
        const pages: Record<string, number> = {};
        webSessions.forEach(s => {
            const p = s.currentPage || 'الرئيسية';
            pages[p] = (pages[p] || 0) + 1;
        });
        return Object.entries(pages).sort((a, b) => b[1] - a[1]);
    }, [webSessions]);

    // App Version breakdown
    const appVersionStats = useMemo(() => {
        const versions: Record<string, number> = {};
        appSessions.forEach(s => {
            const v = s.appVersion || 'v1.0.0';
            versions[v] = (versions[v] || 0) + 1;
        });
        return Object.entries(versions).sort((a, b) => b[1] - a[1]);
    }, [appSessions]);

    // App OS breakdown
    const appOsStats = useMemo(() => {
        const oses: Record<string, number> = {};
        appSessions.forEach(s => {
            const os = s.osVersion || s.platform || 'Android';
            oses[os] = (oses[os] || 0) + 1;
        });
        return Object.entries(oses).sort((a, b) => b[1] - a[1]);
    }, [appSessions]);

    // Regenerate App API Key
    const handleRegenerateApiKey = () => {
        const newKey = 'cinematix_app_sec_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
        setAppApiKey(newKey);
        localStorage.setItem('cinematix_app_api_key', newKey);
        if (addToast) addToast('تم إعادة توليد مفتاح API التطبيق بنجاح! 🔑', 'success');
    };

    // Copy helper
    const handleCopyText = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        if (addToast) addToast(`تم نسخ ${label} إلى الحافظة!`, 'info');
    };

    // Test API call handler
    const handleTestApiCall = async () => {
        setIsTestingApi(true);
        setTestResponse(null);

        try {
            const res = await fetch('/api/app-analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-App-Key': appApiKey
                },
                body: JSON.stringify({
                    apiKey: appApiKey,
                    sessionId: `test_session_${Date.now()}`,
                    userId: testUserId,
                    userName: `مستخدم تجريبي (${testUserId})`,
                    platform: testOs.toLowerCase().includes('ios') ? 'ios' : 'android',
                    appVersion: testAppVersion,
                    deviceModel: testDevice,
                    osVersion: testOs,
                    currentScreen: testScreen,
                    action: 'test_heartbeat'
                })
            });

            const data = await res.json();
            setTestResponse({
                status: res.status,
                statusText: res.statusText,
                data
            });

            if (res.ok) {
                if (addToast) addToast('تم إرسال نداء الاختبار واستلام الاستجابة بنجاح! 🚀', 'success');
            } else {
                if (addToast) addToast('فشل اختبار الـ API: ' + (data.error || 'خطأ غير معروف'), 'error');
            }
        } catch (err: any) {
            setTestResponse({
                status: 500,
                error: err.message
            });
            if (addToast) addToast('حدث خطأ أثناء إجراء نداء الاختبار: ' + err.message, 'error');
        } finally {
            setIsTestingApi(false);
        }
    };

    // Export Excel Report for Web Usage
    const handleExportExcelReport = () => {
        try {
            const reportData = webSessions.map((s, idx) => ({
                '#': idx + 1,
                'اسم المستخدم / الزائر': s.userName || 'زائر',
                'معرف الجلسة': s.sessionId,
                'الجهاز': s.device || 'غير معروف',
                'المتصفح': s.browser || 'غير معروف',
                'الصفحة الحالية': s.currentPage || 'الرئيسية',
                'التاريخ': s.date || s.lastSeen?.split('T')[0],
                'آخر تواجد': s.lastSeen
            }));

            const summaryData = [
                { 'المعيار': 'إجمالي الجلسات النشطة', 'القيمة': webSessions.length },
                { 'المعيار': 'المستخدمين أونلاين الآن (مباشر)', 'القيمة': liveWebUsers.length },
                { 'المعيار': 'أكثر جهاز استخداماً', 'القيمة': webDeviceStats[0]?.[0] || 'غير محدد' },
                { 'المعيار': 'أكثر صفحة زيارة', 'القيمة': webTopPages[0]?.[0] || 'غير محدد' },
                { 'المعيار': 'تاريخ استخراج التقرير', 'القيمة': new Date().toLocaleString('ar-EG') }
            ];

            const wb = XLSX.utils.book_new();
            const wsSummary = XLSX.utils.json_to_sheet(summaryData);
            const wsDetails = XLSX.utils.json_to_sheet(reportData);

            XLSX.utils.book_append_sheet(wb, wsSummary, 'ملخص التقرير');
            XLSX.utils.book_append_sheet(wb, wsDetails, 'سجل الجلسات التفصيلي');

            XLSX.writeFile(wb, `Cinematix_Web_Usage_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
            if (addToast) addToast('تم تصدير تقرير Excel بنجاح! 📊', 'success');
        } catch (e: any) {
            if (addToast) addToast('فشل تصدير التقرير: ' + e.message, 'error');
        }
    };

    // Print PDF Report
    const handlePrintReport = () => {
        const printWin = window.open('', '_blank');
        if (!printWin) return;

        const content = `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>تقرير استخدام موقع سينماتيكس</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; color: #111; }
                    h1 { color: #00A7F8; text-align: center; }
                    .meta { text-align: center; margin-bottom: 20px; font-size: 14px; color: #666; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: right; font-size: 13px; }
                    th { background-color: #f2f2f2; }
                    .stats-grid { display: flex; gap: 15px; margin-bottom: 20px; }
                    .stat-box { flex: 1; padding: 15px; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
                    .stat-num { font-size: 24px; font-weight: bold; color: #00A7F8; }
                </style>
            </head>
            <body>
                <h1>🎬 تقرير سجل استخدام موقع سينماتيكس</h1>
                <div class="meta">تم الاستخراج بتاريخ: ${new Date().toLocaleString('ar-EG')}</div>
                
                <div class="stats-grid">
                    <div class="stat-box">
                        <div>إجمالي الجلسات المسجلة</div>
                        <div class="stat-num">${webSessions.length}</div>
                    </div>
                    <div class="stat-box">
                        <div>المستخدمون أونلاين الآن</div>
                        <div class="stat-num">${liveWebUsers.length}</div>
                    </div>
                    <div class="stat-box">
                        <div>الأجهزة الأكثر استخداماً</div>
                        <div class="stat-num" style="font-size:16px;">${webDeviceStats[0]?.[0] || 'غير محدد'}</div>
                    </div>
                </div>

                <h3>جدول الجلسات والنشاط</h3>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>المستخدم / الزائر</th>
                            <th>الجهاز والتطبيق</th>
                            <th>الصفحة الحالية</th>
                            <th>آخر تواجد</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${webSessions.slice(0, 50).map((s, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${s.userName || 'زائر'}</td>
                                <td>${s.device || ''} - ${s.browser || ''}</td>
                                <td>${s.currentPage || 'الرئيسية'}</td>
                                <td>${s.lastSeen || ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `;

        printWin.document.write(content);
        printWin.document.close();
    };

    // Format helper for relative time
    const formatRelativeTime = (isoString?: string, msTime?: number) => {
        const timeMs = msTime || (isoString ? new Date(isoString).getTime() : Date.now());
        const diffSec = Math.floor((Date.now() - timeMs) / 1000);

        if (diffSec < 10) return 'منذ لحظات';
        if (diffSec < 60) return `منذ ${diffSec} ثانية`;
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
        const diffHours = Math.floor(diffMin / 60);
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        return `منذ ${Math.floor(diffHours / 24)} يوم`;
    };

    // Host domain URL for API snippets
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://cinematix.app';

    // Snippet generators for mobile app developers
    const getCodeSnippet = () => {
        switch (selectedCodeSnippet) {
            case 'kotlin':
                return `// Android (Kotlin / OkHttp) Integration
val client = OkHttpClient()
val json = """
{
    "apiKey": "${appApiKey}",
    "sessionId": "app_sess_\${System.currentTimeMillis()}",
    "userId": "user_123",
    "userName": "أحمد علي",
    "platform": "android",
    "appVersion": "2.4.0",
    "deviceModel": "\${Build.MANUFACTURER} \${Build.MODEL}",
    "osVersion": "Android \${Build.VERSION.RELEASE}",
    "currentScreen": "Watch: Episode 1",
    "action": "heartbeat"
}
""".trimIndent()

val body = json.toRequestBody("application/json; charset=utf-8".toMediaType())
val request = Request.Builder()
    .url("${currentOrigin}/api/app-analytics")
    .addHeader("X-App-Key", "${appApiKey}")
    .post(body)
    .build()

client.newCall(request).enqueue(object : Callback {
    override fun onFailure(call: Call, e: IOException) { e.printStackTrace() }
    override fun onResponse(call: Call, response: Response) {
        println("Heartbeat Success: \${response.body?.string()}")
    }
})`;

            case 'flutter':
                return `// Flutter (Dart / http) Integration
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> sendAppHeartbeat() async {
  final url = Uri.parse('${currentOrigin}/api/app-analytics');
  final response = await http.post(
    url,
    headers: {
      'Content-Type': 'application/json',
      'X-App-Key': '${appApiKey}',
    },
    body: jsonEncode({
      'apiKey': '${appApiKey}',
      'sessionId': 'flutter_sess_\${DateTime.now().millisecondsSinceEpoch}',
      'userId': 'user_flutter_1',
      'userName': 'مستخدم فلاتر',
      'platform': 'flutter',
      'appVersion': '1.2.0',
      'deviceModel': 'Xiaomi Redmi Note 13',
      'osVersion': 'Android 13',
      'currentScreen': 'MoviesTab',
      'action': 'heartbeat',
    }),
  );

  if (response.statusCode == 200) {
    print('Analytics logged successfully');
  }
}`;

            case 'react-native':
                return `// React Native / JavaScript Integration
const sendAppHeartbeat = async () => {
  try {
    const res = await fetch('${currentOrigin}/api/app-analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Key': '${appApiKey}'
      },
      body: JSON.stringify({
        apiKey: '${appApiKey}',
        sessionId: \`rn_sess_\${Date.now()}\`,
        userId: 'user_rn_99',
        userName: 'مستخدم رياكت',
        platform: 'react-native',
        appVersion: '2.0.1',
        deviceModel: 'iPhone 15 Pro',
        osVersion: 'iOS 17.2',
        currentScreen: 'HomeScreen',
        action: 'heartbeat'
      })
    });
    const data = await res.json();
    console.log('App Analytics Response:', data);
  } catch (err) {
    console.error('Failed to send heartbeat:', err);
  }
};`;

            case 'swift':
                return `// Swift / iOS (URLSession) Integration
import Foundation

func sendAppHeartbeat() {
    guard let url = URL(string: "${currentOrigin}/api/app-analytics") else { return }
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("${appApiKey}", forHTTPHeaderField: "X-App-Key")
    
    let body: [String: Any] = [
        "apiKey": "${appApiKey}",
        "sessionId": "ios_sess_\\(Int(Date().timeIntervalSince1970))",
        "userId": "user_ios_7",
        "userName": "مستخدم آيفون",
        "platform": "ios",
        "appVersion": "3.1.0",
        "deviceModel": "iPhone 14",
        "osVersion": "iOS 16.5",
        "currentScreen": "PlayerView",
        "action": "heartbeat"
    ]
    
    request.httpBody = try? JSONSerialization.data(withJSONObject: body)
    
    URLSession.shared.dataTask(with: request) { data, response, error in
        if let data = data, let str = String(data: data, encoding: .utf8) {
            print("Response: \\(str)")
        }
    }.resume()
}`;

            case 'curl':
                return `# cURL Request Example
curl -X POST "${currentOrigin}/api/app-analytics" \\
  -H "Content-Type: application/json" \\
  -H "X-App-Key: ${appApiKey}" \\
  -d '{
    "apiKey": "${appApiKey}",
    "sessionId": "curl_sess_1001",
    "userId": "curl_dev",
    "userName": "اختبار cURL",
    "platform": "android",
    "appVersion": "1.0.0",
    "deviceModel": "Terminal / Server",
    "osVersion": "Linux",
    "currentScreen": "ApiTest",
    "action": "heartbeat"
  }'`;
        }
    };

    return (
        <div className="space-y-8 font-sans text-right" dir="rtl">
            {/* Top Navigation Bar: Screen Switcher */}
            <div className="bg-[#121620] p-3 rounded-2xl border border-gray-800 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => setActiveScreen('website')}
                        className={`flex-1 sm:flex-none px-6 py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2.5 ${
                            activeScreen === 'website'
                                ? 'bg-gradient-to-r from-[#00A7F8] to-[#0080FF] text-white shadow-lg shadow-[#00A7F8]/20 scale-[1.02]'
                                : 'bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-800'
                        }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <span>الشاشة 1: الموقع الإلكتروني</span>
                        <span className="bg-black/30 px-2 py-0.5 rounded-full text-xs font-mono">
                            {liveWebUsers.length} مباشر
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveScreen('app')}
                        className={`flex-1 sm:flex-none px-6 py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2.5 ${
                            activeScreen === 'app'
                                ? 'bg-gradient-to-r from-[#00FFB0] to-[#00C888] text-black shadow-lg shadow-[#00FFB0]/20 scale-[1.02]'
                                : 'bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-800'
                        }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span>الشاشة 2: تطبيق الموبايل و API</span>
                        <span className="bg-black/30 px-2 py-0.5 rounded-full text-xs font-mono">
                            {liveAppUsers.length} مباشر
                        </span>
                    </button>
                </div>

                <div className="text-xs text-gray-400 flex items-center gap-2 px-3 py-1.5 bg-gray-900/60 rounded-xl border border-gray-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>تحديث حي فوري للمستخدمين النشطين</span>
                </div>
            </div>

            {/* SCREEN 1: WEBSITE USAGE */}
            {activeScreen === 'website' && (
                <div className="space-y-8 animate-fade-in">
                    {/* Header & Controls Bar */}
                    <div className="bg-[#121620] p-6 rounded-2xl border border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                <span>سجل نشاط واستخدام الموقع الإلكتروني</span>
                                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    {liveWebUsers.length} أونلاين الآن
                                </span>
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">تتبع حركة الزوار والمستخدمين المباشرة وتقارير الأداء الشاملة للموقع.</p>
                        </div>

                        {/* Period selector */}
                        <div className="flex flex-wrap items-center gap-2 bg-gray-900/90 p-1.5 rounded-xl border border-gray-800">
                            {[
                                { id: 'now', label: 'الآن (مباشر)' },
                                { id: 'today', label: 'اليوم' },
                                { id: 'week', label: 'الأسبوع' },
                                { id: 'month', label: 'الشهر' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setWebPeriod(tab.id as any)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                        webPeriod === tab.id
                                            ? 'bg-[#00A7F8] text-white shadow-md'
                                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stat Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div className="bg-[#121620] p-6 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
                            <div className="text-gray-400 text-xs font-bold mb-2">نشطين أونلاين الآن (Live)</div>
                            <div className="text-4xl font-black text-emerald-400 font-mono flex items-baseline gap-2">
                                {liveWebUsers.length}
                                <span className="text-xs font-normal text-gray-500">مستخدم</span>
                            </div>
                            <div className="text-[11px] text-gray-500 mt-2">تحديث كل 25 ثانية تلقائياً</div>
                        </div>

                        <div className="bg-[#121620] p-6 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-2 h-full bg-[#00A7F8]"></div>
                            <div className="text-gray-400 text-xs font-bold mb-2">إجمالي الجلسات ({webPeriod === 'now' ? 'الآن' : webPeriod === 'today' ? 'اليوم' : webPeriod === 'week' ? 'الأسبوع' : 'الشهر'})</div>
                            <div className="text-4xl font-black text-[#00A7F8] font-mono flex items-baseline gap-2">
                                {filteredWebSessions.length}
                                <span className="text-xs font-normal text-gray-500">جلسة</span>
                            </div>
                            <div className="text-[11px] text-gray-500 mt-2">مجمعة حسب الفترة المحددة</div>
                        </div>

                        <div className="bg-[#121620] p-6 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-2 h-full bg-purple-500"></div>
                            <div className="text-gray-400 text-xs font-bold mb-2">الأجهزة الأكثر استخداماً</div>
                            <div className="text-xl font-black text-purple-400 truncate mt-1">
                                {webDeviceStats[0]?.[0] || 'سطح المكتب'}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-2">
                                {webDeviceStats[0]?.[1] || 0} جلسة ({Math.round(((webDeviceStats[0]?.[1] || 0) / (filteredWebSessions.length || 1)) * 100)}%)
                            </div>
                        </div>

                        <div className="bg-[#121620] p-6 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
                            <div className="text-gray-400 text-xs font-bold mb-2">تقرير الاستخدام</div>
                            <button
                                onClick={() => setIsReportModalOpen(true)}
                                className="w-full mt-2 py-2.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>توليد وتصدير تقرير</span>
                            </button>
                        </div>
                    </div>

                    {/* Active Live Web Users Table & Page Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Table column */}
                        <div className="lg:col-span-2 bg-[#121620] p-6 rounded-2xl border border-gray-800 shadow-xl space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <span>جدول المستخدمين المباشر والجلسات</span>
                                        <span className="text-xs bg-gray-800 text-gray-300 px-2.5 py-1 rounded-full font-mono">
                                            {filteredWebSessions.length}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-gray-400">قائمة تفصيلية بأنشطة الموقع الحالية والحسابات النشطة</p>
                                </div>

                                <div className="relative w-full sm:w-64">
                                    <input
                                        type="text"
                                        placeholder="بحث باسم، صفحة، جهاز..."
                                        value={webSearchQuery}
                                        onChange={(e) => setWebSearchQuery(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-800 text-xs rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-[#00A7F8]"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto custom-scrollbar max-h-[450px]">
                                <table className="w-full text-right text-xs text-gray-300">
                                    <thead className="bg-gray-900/80 text-gray-400 font-bold sticky top-0 z-10 backdrop-blur-sm">
                                        <tr>
                                            <th className="p-3 rounded-r-lg">الحالة</th>
                                            <th className="p-3">المستخدم / الحساب</th>
                                            <th className="p-3">الجهاز والحديث</th>
                                            <th className="p-3">الصفحة الحالية</th>
                                            <th className="p-3 rounded-l-lg">آخر نداء</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50">
                                        {filteredWebSessions.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-12 text-gray-500">
                                                    لا توجد جلسات نشطة مطابقة للفترة أو البحث حالياً
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredWebSessions.map((session) => {
                                                const isLive = (session.lastSeenMs || 0) >= Date.now() - 3 * 60 * 1000;
                                                return (
                                                    <tr key={session.id || session.sessionId} className="hover:bg-gray-800/40 transition-colors">
                                                        <td className="p-3">
                                                            {isLive ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                                                    مباشر
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-800 text-gray-400">
                                                                    سابق
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 font-bold text-white">
                                                            {session.userName || 'زائر الموقع'}
                                                            <div className="text-[10px] font-normal text-gray-500 font-mono truncate max-w-[120px]">
                                                                {session.userId || session.sessionId}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-gray-300">
                                                            <div className="font-semibold">{session.device || 'سطح المكتب'}</div>
                                                            <div className="text-[10px] text-gray-500">{session.browser || 'متصفح'}</div>
                                                        </td>
                                                        <td className="p-3 max-w-[180px] truncate text-[#00A7F8] font-monoDir">
                                                            {session.currentPage || '/'}
                                                        </td>
                                                        <td className="p-3 text-gray-400 text-[11px] font-mono">
                                                            {formatRelativeTime(session.lastSeen, session.lastSeenMs)}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Analytics Breakdown Column */}
                        <div className="space-y-6">
                            {/* Top Pages */}
                            <div className="bg-[#121620] p-6 rounded-2xl border border-gray-800 shadow-xl space-y-4">
                                <h3 className="text-base font-bold text-white flex items-center justify-between">
                                    <span>الصفحات الأكثر زيارة</span>
                                    <span className="text-xs text-[#00A7F8] font-normal">توزيع حقيقي</span>
                                </h3>

                                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                                    {webTopPages.length === 0 ? (
                                        <div className="text-xs text-gray-500 text-center py-6">لا توجد بيانات صفحة حتى الآن</div>
                                    ) : (
                                        webTopPages.slice(0, 6).map(([page, count]) => (
                                            <div key={page} className="p-2.5 bg-gray-900/60 rounded-xl border border-gray-800/80 flex items-center justify-between text-xs">
                                                <span className="font-mono text-gray-300 truncate max-w-[180px]">{page}</span>
                                                <span className="bg-[#00A7F8]/20 text-[#00A7F8] px-2.5 py-0.5 rounded-lg font-bold font-mono">
                                                    {count} زيارة
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Devices Breakdown */}
                            <div className="bg-[#121620] p-6 rounded-2xl border border-gray-800 shadow-xl space-y-4">
                                <h3 className="text-base font-bold text-white">توزيع أنواع الأجهزة</h3>
                                <div className="space-y-3">
                                    {webDeviceStats.map(([device, count]) => {
                                        const pct = Math.round((count / (webSessions.length || 1)) * 100);
                                        return (
                                            <div key={device} className="space-y-1">
                                                <div className="flex justify-between text-xs text-gray-300">
                                                    <span>{device}</span>
                                                    <span className="font-mono text-gray-400">{count} ({pct}%)</span>
                                                </div>
                                                <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                                                    <div className="bg-[#00A7F8] h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SCREEN 2: MOBILE APP USAGE & API HUB */}
            {activeScreen === 'app' && (
                <div className="space-y-8 animate-fade-in">
                    {/* App Header & Period Controls */}
                    <div className="bg-[#121620] p-6 rounded-2xl border border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                <span>سجل استخدام تطبيق الموبايل وربط الـ API</span>
                                <span className="text-xs font-bold text-[#00FFB0] bg-[#00FFB0]/10 border border-[#00FFB0]/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-[#00FFB0] animate-pulse"></span>
                                    {liveAppUsers.length} نشط بالتطبيق الآن
                                </span>
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">شاشة مراقبة مستخدمي تطبيق Android / iOS وإمداد المبرمج ببروتوكولات ربط API.</p>
                        </div>

                        {/* Period selector */}
                        <div className="flex flex-wrap items-center gap-2 bg-gray-900/90 p-1.5 rounded-xl border border-gray-800">
                            {[
                                { id: 'now', label: 'الآن (مباشر)' },
                                { id: 'today', label: 'اليوم' },
                                { id: 'week', label: 'الأسبوع' },
                                { id: 'month', label: 'الشهر' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setAppPeriod(tab.id as any)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                        appPeriod === tab.id
                                            ? 'bg-[#00FFB0] text-black shadow-md font-black'
                                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stat Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div className="bg-[#121620] p-6 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-2 h-full bg-[#00FFB0]"></div>
                            <div className="text-gray-400 text-xs font-bold mb-2">مستخدمو التطبيق الأونلاين الآن</div>
                            <div className="text-4xl font-black text-[#00FFB0] font-mono flex items-baseline gap-2">
                                {liveAppUsers.length}
                                <span className="text-xs font-normal text-gray-500">نشط</span>
                            </div>
                            <div className="text-[11px] text-gray-500 mt-2">عبر نداءات API Heartbeat المباشرة</div>
                        </div>

                        <div className="bg-[#121620] p-6 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-2 h-full bg-[#00A7F8]"></div>
                            <div className="text-gray-400 text-xs font-bold mb-2">إجمالي نداءات التطبيق (النشاط)</div>
                            <div className="text-4xl font-black text-[#00A7F8] font-mono flex items-baseline gap-2">
                                {filteredAppSessions.length}
                                <span className="text-xs font-normal text-gray-500">سجل</span>
                            </div>
                            <div className="text-[11px] text-gray-500 mt-2">فترة المراقبة المختارة</div>
                        </div>

                        <div className="bg-[#121620] p-6 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500"></div>
                            <div className="text-gray-400 text-xs font-bold mb-2">أبرز إصدارات التطبيق النشطة</div>
                            <div className="text-xl font-black text-indigo-400 truncate mt-1">
                                {appVersionStats[0]?.[0] || 'v1.0.0'}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-2">
                                {appVersionStats[0]?.[1] || 0} مستخدم ({Math.round(((appVersionStats[0]?.[1] || 0) / (filteredAppSessions.length || 1)) * 100)}%)
                            </div>
                        </div>

                        <div className="bg-[#121620] p-6 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-2 h-full bg-pink-500"></div>
                            <div className="text-gray-400 text-xs font-bold mb-2">أنظمة التشغيل</div>
                            <div className="text-xl font-black text-pink-400 truncate mt-1">
                                {appOsStats[0]?.[0] || 'Android'}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-2">Android vs iOS</div>
                        </div>
                    </div>

                    {/* App Live Sessions Table */}
                    <div className="bg-[#121620] p-6 rounded-2xl border border-gray-800 shadow-xl space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <span>جدول مستخدمي التطبيق وسجل الأجهزة الحية</span>
                                    <span className="text-xs bg-gray-800 text-gray-300 px-2.5 py-1 rounded-full font-mono">
                                        {filteredAppSessions.length}
                                    </span>
                                </h3>
                                <p className="text-xs text-gray-400">تحديث فوري لنداءات أجهزة الموبايل والتطبيقات المتصلة</p>
                            </div>

                            <div className="relative w-full sm:w-64">
                                <input
                                    type="text"
                                    placeholder="بحث باسم، جهاز، شاشة، إصدار..."
                                    value={appSearchQuery}
                                    onChange={(e) => setAppSearchQuery(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-800 text-xs rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-[#00FFB0]"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar max-h-[400px]">
                            <table className="w-full text-right text-xs text-gray-300">
                                <thead className="bg-gray-900/80 text-gray-400 font-bold sticky top-0 z-10 backdrop-blur-sm">
                                    <tr>
                                        <th className="p-3 rounded-r-lg">الحالة</th>
                                        <th className="p-3">اسم المستخدم / ID</th>
                                        <th className="p-3">نوع الجهاز وموديله</th>
                                        <th className="p-3">نظام التشغيل وإصدار التطبيق</th>
                                        <th className="p-3">الشاشة / الشغل الحالي</th>
                                        <th className="p-3 rounded-l-lg">آخر ظهور (Heartbeat)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/50">
                                    {filteredAppSessions.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12 text-gray-500">
                                                لا يوجد مستخدمون للتطبيق مسجلون في هذه الفترة حتى الآن
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAppSessions.map((session) => {
                                            const isLive = (session.lastSeenMs || 0) >= Date.now() - 3 * 60 * 1000;
                                            return (
                                                <tr key={session.id || session.sessionId} className="hover:bg-gray-800/40 transition-colors">
                                                    <td className="p-3">
                                                        {isLive ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                                                مباشر الآن
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-800 text-gray-400">
                                                                السابق
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 font-bold text-white">
                                                        {session.userName || 'زائر التطبيق'}
                                                        <div className="text-[10px] text-gray-500 font-mono truncate max-w-[120px]">
                                                            {session.userId}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-gray-300 font-medium">
                                                        {session.deviceModel || 'هاتف ذكي'}
                                                    </td>
                                                    <td className="p-3 text-gray-300">
                                                        <span className="text-[#00FFB0] font-bold font-mono">{session.appVersion || 'v1.0'}</span>
                                                        <span className="text-gray-500 mr-2">({session.osVersion || session.platform})</span>
                                                    </td>
                                                    <td className="p-3 text-[#00A7F8] max-w-[180px] truncate">
                                                        {session.currentScreen || 'الرئيسية'}
                                                    </td>
                                                    <td className="p-3 text-gray-400 font-mono">
                                                        {formatRelativeTime(session.lastSeen, session.lastSeenMs)}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* APP DEVELOPER INTEGRATION HUB (قسم ربط API لمبرمج التطبيق) */}
                    <div className="bg-[#121620] p-8 rounded-2xl border border-gray-800 shadow-2xl space-y-8">
                        <div className="border-b border-gray-800 pb-6">
                            <h3 className="text-xl font-black text-[#00FFB0] flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                </svg>
                                <span>مركز ربط الـ API لمبرمج التطبيق (Developer Integration Hub)</span>
                            </h3>
                            <p className="text-sm text-gray-400 mt-1">قم بتزويد مبرمج التطبيق بهذه العناوين والأكواد لربط شاشة الموبايل بلوحة التحكم مباشرة.</p>
                        </div>

                        {/* API Key & Endpoint Configuration Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Endpoint Card */}
                            <div className="bg-gray-900/90 p-5 rounded-xl border border-gray-800 space-y-3">
                                <div className="text-xs font-bold text-gray-400 flex items-center justify-between">
                                    <span>رابط الـ API للتطبيق (Endpoint URL)</span>
                                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[10px] px-2 py-0.5 rounded-full font-bold">POST / GET</span>
                                </div>
                                <div className="flex items-center gap-2 bg-black/60 p-3 rounded-lg border border-gray-800 font-mono text-xs text-[#00FFB0] break-all">
                                    <span>{currentOrigin}/api/app-analytics</span>
                                </div>
                                <button
                                    onClick={() => handleCopyText(`${currentOrigin}/api/app-analytics`, 'رابط API التطبيق')}
                                    className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <span>نسخ الرابط لمبرمج التطبيق</span>
                                </button>
                            </div>

                            {/* API Secret Key Card */}
                            <div className="bg-gray-900/90 p-5 rounded-xl border border-gray-800 space-y-3">
                                <div className="text-xs font-bold text-gray-400 flex items-center justify-between">
                                    <span>مفتاح مصادقة التطبيق (App API Secret Key)</span>
                                    <button
                                        onClick={handleRegenerateApiKey}
                                        className="text-[10px] text-amber-400 hover:underline font-bold"
                                    >
                                        إعادة توليد المفتاح 🔑
                                    </button>
                                </div>
                                <div className="flex items-center justify-between bg-black/60 p-3 rounded-lg border border-gray-800 font-mono text-xs text-amber-300">
                                    <span>{showApiKey ? appApiKey : '••••••••••••••••••••••••••••'}</span>
                                    <button
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        className="text-xs text-gray-400 hover:text-white mr-2"
                                    >
                                        {showApiKey ? 'إخفاء' : 'إظهار'}
                                    </button>
                                </div>
                                <button
                                    onClick={() => handleCopyText(appApiKey, 'مفتاح API التطبيق')}
                                    className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <span>نسخ المفتاح السري</span>
                                </button>
                            </div>
                        </div>

                        {/* Interactive Developer Code Snippets */}
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                    <span>نماذج أكواد جاهزة لمبرمج التطبيق</span>
                                    <span className="text-xs text-gray-500 font-normal">(اختر اللغة لإظهار الكود)</span>
                                </h4>

                                {/* Snippet selector */}
                                <div className="flex flex-wrap items-center gap-1.5 bg-gray-900 p-1 rounded-xl border border-gray-800">
                                    {[
                                        { id: 'kotlin', label: 'Android (Kotlin)' },
                                        { id: 'flutter', label: 'Flutter' },
                                        { id: 'react-native', label: 'React Native' },
                                        { id: 'swift', label: 'iOS (Swift)' },
                                        { id: 'curl', label: 'cURL' }
                                    ].map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => setSelectedCodeSnippet(item.id as any)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                selectedCodeSnippet === item.id
                                                    ? 'bg-[#00A7F8] text-white shadow-sm'
                                                    : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="relative">
                                <pre className="bg-black/90 p-5 rounded-xl border border-gray-800 font-mono text-xs text-emerald-400 overflow-x-auto custom-scrollbar leading-relaxed text-left" dir="ltr">
                                    <code>{getCodeSnippet()}</code>
                                </pre>
                                <button
                                    onClick={() => handleCopyText(getCodeSnippet(), 'كود الربط')}
                                    className="absolute top-3 right-3 bg-gray-800/80 hover:bg-gray-700 text-gray-200 text-xs px-3 py-1.5 rounded-lg border border-gray-700 backdrop-blur-sm transition-all"
                                >
                                    نسخ الكود 📋
                                </button>
                            </div>
                        </div>

                        {/* Live API Tester Console */}
                        <div className="bg-gray-900/80 p-6 rounded-2xl border border-gray-800 space-y-6">
                            <div>
                                <h4 className="text-base font-bold text-white flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span>وحدة اختبار الـ API المباشرة (Live API Tester)</span>
                                </h4>
                                <p className="text-xs text-gray-400 mt-1">يمكنك تجربة إرسال نداء من التطبيق الآن مباشرة لرؤيته يظهر في الجدول أعلى الشاشة بشكل فوري!</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">موديل الجهاز (Device Model)</label>
                                    <input
                                        type="text"
                                        value={testDevice}
                                        onChange={e => setTestDevice(e.target.value)}
                                        className="w-full bg-black/60 border border-gray-800 text-xs rounded-xl p-3 text-white focus:border-[#00FFB0] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">نظام التشغيل (OS Version)</label>
                                    <input
                                        type="text"
                                        value={testOs}
                                        onChange={e => setTestOs(e.target.value)}
                                        className="w-full bg-black/60 border border-gray-800 text-xs rounded-xl p-3 text-white focus:border-[#00FFB0] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">إصدار التطبيق (App Version)</label>
                                    <input
                                        type="text"
                                        value={testAppVersion}
                                        onChange={e => setTestAppVersion(e.target.value)}
                                        className="w-full bg-black/60 border border-gray-800 text-xs rounded-xl p-3 text-white focus:border-[#00FFB0] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">الشاشة الحالية (Screen Name)</label>
                                    <input
                                        type="text"
                                        value={testScreen}
                                        onChange={e => setTestScreen(e.target.value)}
                                        className="w-full bg-black/60 border border-gray-800 text-xs rounded-xl p-3 text-white focus:border-[#00FFB0] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">معرف المستخدم (User ID)</label>
                                    <input
                                        type="text"
                                        value={testUserId}
                                        onChange={e => setTestUserId(e.target.value)}
                                        className="w-full bg-black/60 border border-gray-800 text-xs rounded-xl p-3 text-white focus:border-[#00FFB0] focus:outline-none"
                                    />
                                </div>

                                <div className="flex items-end">
                                    <button
                                        onClick={handleTestApiCall}
                                        disabled={isTestingApi}
                                        className="w-full py-3 bg-[#00FFB0] hover:bg-[#00D895] text-black text-xs font-black rounded-xl transition-all shadow-lg shadow-[#00FFB0]/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isTestingApi ? (
                                            <span>جاري الإرسال...</span>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                <span>إرسال نداء اختبار (Send Test Heartbeat)</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Response Inspector */}
                            {testResponse && (
                                <div className="bg-black/90 p-4 rounded-xl border border-gray-800 space-y-2 animate-fade-in text-left" dir="ltr">
                                    <div className="flex items-center justify-between text-xs font-bold border-b border-gray-800 pb-2">
                                        <span className="text-gray-400">Response Result:</span>
                                        <span className={testResponse.status === 200 ? 'text-emerald-400 font-mono' : 'text-red-400 font-mono'}>
                                            HTTP {testResponse.status} {testResponse.statusText || ''}
                                        </span>
                                    </div>
                                    <pre className="font-mono text-[11px] text-gray-300 overflow-x-auto">
                                        {JSON.stringify(testResponse.data || testResponse, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* WEB REPORT GENERATOR MODAL */}
            {isReportModalOpen && (
                <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#121620] border border-gray-800 w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in">
                        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                            <h3 className="text-xl font-black text-white flex items-center gap-2">
                                📊 <span>توليد واستخراج تقرير استخدام الموقع</span>
                            </h3>
                            <button
                                onClick={() => setIsReportModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">من تاريخ</label>
                                <input
                                    type="date"
                                    value={reportDateFrom}
                                    onChange={e => setReportDateFrom(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-800 text-xs rounded-xl p-3 text-white focus:border-[#00A7F8] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">إلى تاريخ</label>
                                <input
                                    type="date"
                                    value={reportDateTo}
                                    onChange={e => setReportDateTo(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-800 text-xs rounded-xl p-3 text-white focus:border-[#00A7F8] focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Report Stats Preview */}
                        <div className="bg-gray-900/80 p-5 rounded-2xl border border-gray-800 space-y-3 text-xs">
                            <div className="font-bold text-white text-sm border-b border-gray-800 pb-2">معاينة عناصر التقرير المستخرج:</div>
                            <div className="flex justify-between text-gray-300">
                                <span>عدد الجلسات المسجلة للتقرير:</span>
                                <span className="font-bold text-[#00A7F8] font-mono">{webSessions.length} جلسة</span>
                            </div>
                            <div className="flex justify-between text-gray-300">
                                <span>المستخدمين النشطين أونلاين:</span>
                                <span className="font-bold text-emerald-400 font-mono">{liveWebUsers.length} مستخدم</span>
                            </div>
                            <div className="flex justify-between text-gray-300">
                                <span>نوع صيغة التقرير:</span>
                                <span className="font-bold text-amber-400">ملف Excel (.xlsx) + طباعة PDF</span>
                            </div>
                        </div>

                        {/* Export Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                onClick={handleExportExcelReport}
                                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>تصدير إلى Excel (.xlsx)</span>
                            </button>

                            <button
                                onClick={handlePrintReport}
                                className="flex-1 py-3.5 bg-[#00A7F8] hover:bg-[#0080FF] text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#00A7F8]/30"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                <span>طباعة التقرير / PDF</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsageLogsTab;
