import { authClient } from "@/lib/auth-client"; //import the auth client

type AuthParams = {
  email: string;
  password: string;
  name: string;
  image?: string;
  callbackURL?: string;
};

export const signUp = async ({
  email,
  password,
  name,
  image,
  callbackURL,
}: AuthParams) => {
  const { data, error } = await authClient.signUp.email(
    {
      email,
      password,
      name,
      image,
      callbackURL,
    },
    {
      onRequest: () => {},
      onSuccess: () => {},
      onError: (ctx) => {
        console.log(ctx.error.message);
      },
    },
  );
  if (error) {
    throw new Error(error.message);
  }
  return data;
};
