const baseUrl =
  process.env.FIRESTORE_EMULATOR_HOST
    ? `http://${process.env.FIRESTORE_EMULATOR_HOST}`
    : 'http://127.0.0.1:8080';
const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT || 'demo-realx';
const documentsUrl = `${baseUrl}/v1/projects/${projectId}/databases/(default)/documents`;

const documentBody = {
  fields: {
    name: { stringValue: 'rules validation' },
    createdAt: { timestampValue: new Date().toISOString() },
  },
};

const allowedAnonymousReads = [
  'cms/guest-validation',
  'categories/guest-validation',
  'vendors/guest-validation',
  'maps/guest-validation',
  'mapLocations/guest-validation',
];

const deniedAnonymousReads = [
  'students/userA',
  'students/userA/savedItems/itemA',
  'transactions/txA',
  'notifications/notificationA',
  'pushTokens/tokenA',
  'vendorRedemptionSecrets/vendorA',
  'vendor_pins/vendorA',
  'vendorOnlineRedemptionConfigs/vendorA',
  'onlineVendorAnalytics/vendorA',
  'onlineVendorAnalytics/vendorA/days/2026-07-10',
  'onlineVendorClickRequests/requestA',
  'redemption_rate_limits/limitA',
  'rate_limits/limitA',
  'otps/student@example.com',
  'verification_requests/requestA',
  'wakti_student_verification_requests/requestA',
  'events/eventA',
  'rewards/rewardA',
  'offers/offerA',
];

const deniedAnonymousWrites = [
  ...allowedAnonymousReads,
  ...deniedAnonymousReads,
  'students/userA/onlineRedemptionCounters/vendorA',
  'creator_codes/CODE1',
  'meta/vendorList',
];

async function request(path, init = {}) {
  const response = await fetch(`${documentsUrl}/${path}`, init);
  const body = await response.text();
  return { body, status: response.status };
}

function assertStatus(description, actual, expectedStatuses) {
  if (!expectedStatuses.includes(actual)) {
    throw new Error(`${description}: expected ${expectedStatuses.join(' or ')}, got ${actual}`);
  }
}

for (const path of allowedAnonymousReads) {
  const response = await request(path);
  assertStatus(`anonymous read should be allowed for ${path}`, response.status, [200, 404]);
}

for (const path of deniedAnonymousReads) {
  const response = await request(path);
  assertStatus(`anonymous read should be denied for ${path}`, response.status, [403]);
}

for (const path of deniedAnonymousWrites) {
  const response = await request(path, {
    body: JSON.stringify(documentBody),
    headers: { 'Content-Type': 'application/json' },
    method: 'PATCH',
  });
  assertStatus(`anonymous write should be denied for ${path}`, response.status, [403]);
}

console.log(JSON.stringify({
  anonymousReadAllowed: allowedAnonymousReads.length,
  anonymousReadDenied: deniedAnonymousReads.length,
  anonymousWriteDenied: deniedAnonymousWrites.length,
}, null, 2));
