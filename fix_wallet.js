const fs = require('fs');
const path = 'c:/Users/ADMIN/Documents/project/Site/clarity-trade/src/pages/dashboard/WalletPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// Regex for Crypto Deposit KYC check
const cryptoKycRegex = /\{user\?\.kyc !== 'Verified' \? \([\s\S]*?<div className="p-10 text-center bg-card border border-border rounded-\[3rem\] space-y-8 flex flex-col items-center justify-center min-h-\[400px\] shadow-huge">[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?\) : \(/;

content = content.replace(cryptoKycRegex, 'true ? (');

// Regex for Fiat Deposit KYC check
const fiatKycRegex = /\{user\?\.kyc !== 'Verified' \? \([\s\S]*?<div className="p-10 text-center bg-card border border-border rounded-\[3rem\] space-y-8 flex flex-col items-center justify-center min-h-\[400px\] shadow-huge">[\s\S]*?<\/div>[\s\S]*?<\/Button>\s*<\/div>\s*\) : \(/;

content = content.replace(fiatKycRegex, 'true ? (');

// Fix the mangled characters again just in case
content = content.replace(/Ã¢â€ Â /g, '←');

fs.writeFileSync(path, content, 'utf8');
console.log('WalletPage.tsx updated successfully.');
