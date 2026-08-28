type EmailProviderResponse = {
  data: { id: string } | null;
  error: { name: string } | null;
};

export const requireAcceptedEmail = (response: EmailProviderResponse) => {
  if (response.error || !response.data?.id) {
    const providerCode = response.error?.name || 'unknown_error';
    throw new Error(`Email provider rejected the request: ${providerCode}`);
  }

  return response.data.id;
};
