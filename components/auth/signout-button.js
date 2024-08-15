import { signOut } from "@/auth";

export function SignOut() {
  const handleSignOut = async () => {
    "use server";
    await signOut();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSignOut();
      }}
    >
      <button type="submit">Sign Out</button>
    </form>
  );
}