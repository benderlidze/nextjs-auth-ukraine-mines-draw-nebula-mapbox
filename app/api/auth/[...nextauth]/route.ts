import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // @ts-ignore
      async authorize(credentials) {
        console.log("!!!");
        const { email, password } = credentials ?? {};
        if (!email || !password) {
          throw new Error("Missing username or password");
        }

        const postData = {
          schema: "data",
          table: "user",
          fields: "*",
          // where: `login = '${email}' AND password = '${password}'`,
          where: ``,
        };

        const response = await fetch(
          "http://135.181.151.145:8000/get_table_json/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(postData),
          }
        );
        const data = await response.json();
        console.log("user", data);

        const user = data.find(
          (d: any) => d.login === email && d.password === password
        );

        // if user doesn't exist or password doesn't match
        if (!user) {
          throw new Error("Invalid username or password");
        }
        return {
          session: {
            user: {
              ...user,
            },
          },
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      user && (token.user = user);
      return token;
    },
    session: async ({ session, token }) => {
      // @ts-ignore
      session = token.user;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
