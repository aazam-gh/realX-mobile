# Wakti Partner Student Verification Integration

This document describes the current realX <-> Wakti integration for checking whether a user exists in realX as a student.

There are two separate pieces in this repo:

- A mobile app promo component that points users to Wakti.
- An HTTP verification endpoint that Wakti can call server-to-server during signup.

The partner integration is the HTTP endpoint.

## What realX exposes

realX exposes an HTTPS Cloud Function named `verifyWaktiStudent`.

Implementation details:

- Region: `me-central1`
- Method: `POST` only
- Authentication: shared secret in the `x-wakti-api-key` header
- Request body: JSON with an `email` field
- Response body: JSON with `isStudent: boolean`

The function checks the `students` Firestore collection for a document whose `email` matches the normalized email provided in the request.

## Request Flow

1. Wakti collects the signup email from the user.
2. Wakti sends the email to the realX verification endpoint from its backend.
3. realX validates the API key and email format.
4. realX checks whether the email exists in the `students` collection.
5. realX returns `{"isStudent": true}` or `{"isStudent": false}`.
6. realX stores an audit record in `wakti_student_verification_requests`.

## Endpoint Contract

### URL

Use the deployed HTTPS function URL for `verifyWaktiStudent`.

In Firebase deployments, this is typically the function URL for the `me-central1` region and the `verifyWaktiStudent` export.

### Headers

Required:

```http
x-wakti-api-key: <shared-secret>
Content-Type: application/json
```

### Body

```json
{
  "email": "student@example.com"
}
```

The email is normalized on the realX side with `trim()` and lowercase conversion before lookup.

### Success Response

`200 OK`

```json
{
  "isStudent": true
}
```

or

```json
{
  "isStudent": false
}
```

### Error Responses

- `401 Unauthorized` - missing or incorrect `x-wakti-api-key`
- `400 Bad Request` - missing or invalid email
- `405 Method Not Allowed` - any method other than `POST`

## What Wakti Must Do

Wakti should call this endpoint from its backend only. The shared key must never be shipped in a mobile app, browser app, or any client-side code.

Wakti should:

- Store the realX endpoint URL securely.
- Store the shared API key securely as a server secret.
- Send only the user email needed for the lookup.
- Treat the response as the source of truth for signup gating.
- Retry carefully if needed, but avoid repeated calls for the same signup event unless a retry is actually required.

## What realX Does Internally

When the request passes authentication and validation, realX:

- Normalizes the submitted email.
- Queries Firestore:

```text
students where email == normalized_email
```

- Sets `isStudent` to `true` if a matching student record exists, otherwise `false`.
- Writes an audit document to `wakti_student_verification_requests` with:
  - `email`
  - `isStudent`
  - `status: "success"`
  - `createdAt`

This means Wakti gets a simple yes/no answer, while realX keeps a request log for traceability.

## Important Constraints

- This endpoint only verifies whether the email exists in realX as a student.
- It does not create a student account.
- It does not return student profile details.
- It does not expose any Firestore data other than the boolean result.
- It does not use the Firebase callable SDK; it is a plain HTTP endpoint.

## Recommended Partner Behavior

For best results, Wakti should:

- Send the exact email the user entered during signup.
- Normalize email input on Wakti’s side too, if possible.
- Keep the API key server-side only.
- Treat any non-200 response as an integration error and handle it separately from a normal `false` result.

## Related UI In realX

The mobile app also shows a Wakti promo banner in the home screen, but that is separate from the verification endpoint.

## Example cURL

```bash
curl -X POST "https://me-central1-reelx-backend.cloudfunctions.net/verifyWaktiStudent" \
  -H "Content-Type: application/json" \
  -H "x-wakti-api-key: <shared-secret>" \
  -d '{"email":"student@example.com"}'
```

Expected response:

```json
{ "isStudent": false }
```

