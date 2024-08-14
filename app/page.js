"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import SignUpForm from '@/app/components/SignUpForm';
import SignInForm from '@/app/components/SignInForm';


export default function HomePage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect the user to /chatbot if they are already signed in
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/chatbot');
    }
  }, [status, router]);

  return (
    <div>
      <h1>{isSignUp ? 'Sign Up' : 'Sign In'}</h1>
      {isSignUp ? <SignUpForm /> : <SignInForm />}
      <button onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? 'Already have an account? Sign In' : 'Don’t have an account? Sign Up'}
      </button>
    </div>
  );
}