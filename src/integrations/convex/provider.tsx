import { ConvexProvider, ConvexReactClient } from "convex/react";
import { resolveConvexUrl } from "@/lib/convex-url";

const CONVEX_URL = resolveConvexUrl();
if (!CONVEX_URL) {
	console.error("Missing Convex URL for React client.");
}
const convex = new ConvexReactClient(CONVEX_URL);

export default function AppConvexProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
