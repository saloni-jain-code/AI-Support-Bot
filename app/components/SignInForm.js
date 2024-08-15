"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function SignInForm() {
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    const email = e.target.email.value;
    const password = e.target.password.value;

    const result = await signIn('credentials', {
      redirect: false, // Prevent automatic redirect to handle errors
      email,
      password,
    });

    if (result?.error) {
      // Show error message if sign-in fails
      setError('Failed to sign in. Please check your credentials and try again.');
      console.log(result?.error)
    } else {
      // Redirect to the chatbot page after signing in
      router.push('/chatbot');
    }
  };

  return (
    <div>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      <form onSubmit={handleSignIn}>
        <div>
          <label>Email:</label>
          <input type="email" name="email" required />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" name="password" required />
        </div>
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
}