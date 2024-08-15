import { signIn } from "@/auth";

export function SignIn() {
  const handleSignIn = async (e) => {
    e.preventDefault();
    
    const email = e.target.email.value;
    const password = e.target.password.value;

    // Use the "credentials" provider
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  };

  return (
    <form onSubmit={handleSignIn}>
      <div>
        <label>Email:</label>
        <input type="email" name="email" required />
      </div>
      <div>
        <label>Password:</label>
        <input type="password" name="password" required />
      </div>
      <button type="submit">Sign in</button>
    </form>
  );
}