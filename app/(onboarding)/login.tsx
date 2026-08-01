import { Redirect, useLocalSearchParams } from 'expo-router';

export default function LoginRedirect() {
  const { prefillEmail, role } = useLocalSearchParams<{ prefillEmail?: string; role?: string }>();
  return <Redirect href={{ pathname: '/(onboarding)/email', params: { mode: 'login', prefillEmail, role } }} />;
}
