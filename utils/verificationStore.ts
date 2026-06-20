// In-memory store for the uploaded student ID image between screens.
// Router params can't handle large payloads, so we use this module instead.

let _verificationBase64: string | null = null;

export const setVerificationImage = (base64: string) => {
  _verificationBase64 = base64;
};

export const getVerificationImage = () => _verificationBase64;

export const clearVerificationImage = () => {
  _verificationBase64 = null;
};
