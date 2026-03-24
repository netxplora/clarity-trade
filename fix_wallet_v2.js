const fs = require('fs');
const path = 'c:/Users/ADMIN/Documents/project/Site/clarity-trade/src/pages/dashboard/WalletPage.tsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// Crypto KYC: lines 352 to 368
// In 0-indexed: 351 to 367
// Line 352 is: {user?.kyc !== 'Verified' ? (
// Line 368 is: ) : (
console.log('Line 352:', lines[351]);
console.log('Line 368:', lines[367]);

if (lines[351].includes("user?.kyc !== 'Verified'")) {
    lines[351] = lines[351].replace("user?.kyc !== 'Verified' ?", "true ?");
}

// Fiat KYC: lines 456 to 469
// In 0-indexed: 455 to 468
console.log('Line 456:', lines[455]);
console.log('Line 469:', lines[468]);

if (lines[455].includes("user?.kyc !== 'Verified'")) {
    lines[455] = lines[455].replace("user?.kyc !== 'Verified' ?", "true ?");
}

// Final check for encoding
let newContent = lines.join('\n');
newContent = newContent.replace(/Ã¢â€ Â /g, '←');

fs.writeFileSync(path, newContent, 'utf8');
console.log('Done!');
