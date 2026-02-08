import { Link } from "@tanstack/react-router";
import { Heart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

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
			{/* Desktop Menu */}
			<div className="hidden lg:flex flex-1 justify-end gap-8">
				<div className="flex items-center gap-9">
					<Link
						to="/"
						className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium leading-normal"
					>
						Strona Główna
					</Link>
					<Link
						to="/dashboard"
						className="text-primary text-sm font-bold leading-normal"
					>
						Dashboard
					</Link>
				</div>
				<Button className="rounded-full px-6 font-bold" size="default" asChild>
					<Link to="/dashboard">
						<span className="truncate">Przejdź do dashboardu</span>
					</Link>
				</Button>
			</div>
			{/* Mobile Menu Icon */}
			<Button variant="ghost" size="icon" className="lg:hidden text-foreground">
				<Menu className="size-6" />
			</Button>
		</header>
	);
}
