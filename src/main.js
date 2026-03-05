import { Actor } from 'apify';
import https from 'https';

await Actor.init();

const input = await Actor.getInput() ?? {};
const url = input.url ?? 'https://apify.com';

console.log(`Checking SSL certificate for: ${url}`);

const hostname = url.replace('https://', '').replace('http://', '').split('/')[0];

const result = await new Promise((resolve) => {
    const req = https.request({ host: hostname, port: 443, method: 'GET' }, (res) => {
        const cert = res.socket.getPeerCertificate();
        const validTo = new Date(cert.valid_to);
        const today = new Date();
        const daysLeft = Math.floor((validTo - today) / (1000 * 60 * 60 * 24));

        resolve({
            domain: hostname,
            valid: true,
            issuedTo: cert.subject?.CN || 'Unknown',
            issuedBy: cert.issuer?.O || 'Unknown',
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            daysUntilExpiry: daysLeft,
            status: daysLeft > 30 ? '✅ OK' : daysLeft > 0 ? '⚠️ Expiring soon' : '❌ Expired',
        });
    });

    req.on('error', () => {
        resolve({
            domain: hostname,
            valid: false,
            status: '❌ No valid SSL certificate found',
        });
    });

    req.end();
});

console.log(`Result: ${result.status}`);

await Actor.pushData(result);

await Actor.exit();
