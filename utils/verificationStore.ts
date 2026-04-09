// In-memory store for base64 image data between screens.
// Router params can't handle large payloads, so we use this module instead.

let _frontBase64: string | null = null;
let _backBase64: string | null = null;

export const setVerificationImages = (front: string, back: string) => {
  _frontBase64 = front;
  _backBase64 = back;
};

export const getVerificationImages = () => ({
  frontBase64: _frontBase64,
  backBase64: _backBase64,
});

export const clearVerificationImages = () => {
  _frontBase64 = null;
  _backBase64 = null;
};
