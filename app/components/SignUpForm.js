"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function SignUpForm() {
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    const email = e.target.email.value;
    const password = e.target.password.value;

    const response = await fetch('/api/auth/register', { // Corrected path
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      // Automatically sign in the user after successful registration
      const signInResult = await signIn('credentials', { email, password, redirect: false });
      if (signInResult?.error) {
        setError('Failed to sign in after registration.');
      } else {
        router.push('/chatbot'); // Redirect to the chatbot page after signing in
      }
    } else {
      // Handle errors
      const data = await response.json();
      setError(data.message);
    }
  };

  return (
    <div>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      <form onSubmit={handleSignUp}>
        <div>
          <label>Email:</label>
          <input type="email" name="email" required />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" name="password" required />
        </div>
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
}