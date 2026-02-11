import { Heart } from "lucide-react";

export function DashboardHeader() {
	return (
		<header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-border bg-background px-6 py-3 lg:px-10">
			<div className="flex items-center gap-4 text-primary">
				<div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
					<Heart className="size-5 text-primary fill-current" />
				</div>
				<h2 className="text-foreground text-lg font-bold leading-tight tracking-[-0.015em]">
					Kamila & Kuba
				</h2>
			</div>
		</header>
	);
}
