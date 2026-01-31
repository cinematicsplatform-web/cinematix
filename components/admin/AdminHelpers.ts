import * as jsrsasign from 'jsrsasign';

export const getAccessToken = async (serviceAccountJson: string): Promise<string | null> => {
    try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        const { private_key, client_email } = serviceAccount;
        if (!private_key || !client_email) throw new Error("Invalid Service Account JSON");
        const now = Math.floor(Date.now() / 1000);
        const header = { alg: 'RS256', typ: 'JWT' };
        const claim = { iss: client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now };
        const sJWS = jsrsasign.KJUR.jws.JWS.sign(null, header, claim, private_key);
        const body = new URLSearchParams();
        body.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
        body.append('assertion', sJWS);
        const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body });
        const data = await response.json();
        return data.access_token;
    } catch (e) { console.error("Failed to generate Access Token:", e); return null; }
};

export const sendFCMv1Message = async (token: string, notification: any, accessToken: string, projectId: string) => {
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
    const message = { message: { token: token, notification: { title: notification.title, body: notification.body, image: notification.image }, data: notification.data || {} } };
    const response = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(message) });
    if (!response.ok) { const err = await response.json(); throw new Error(JSON.stringify(err)); }
    return response.json();
};
