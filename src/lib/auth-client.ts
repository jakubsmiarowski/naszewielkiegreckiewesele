import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const signInWithGoogle = async () => {
	const data = await authClient.signIn.social({
		provider: "google",
		callbackURL: "/dashboard",
	});
	if (data.error) {
		throw new Error(data.error.message);
	}
	return data.data;
};
