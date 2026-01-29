import { SignupForm } from '@/features/auth/components/SignupForm';
import { AuthLayout } from '@/features/auth/components/AuthLayout';

export default function SignupPage() {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
}
