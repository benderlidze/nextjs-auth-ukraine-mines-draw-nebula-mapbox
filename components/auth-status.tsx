import { unstable_getServerSession } from "next-auth/next";
import SignOut from "./sign-out";

export default async function AuthStatus() {
  const session = await unstable_getServerSession();
  return (
    <div className="absolute p-2 top-5 ">
      {session && (
        <>
        <p className="text-stone-200 text-sm">
          Signed in as {session.user?.email}
        </p>
        <SignOut />
        </>
      )}
    </div>
  );
}
