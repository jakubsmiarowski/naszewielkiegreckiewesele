import { Calendar } from "lucide-react";
import { Dialog } from "radix-ui";
import { useState } from "react";

export interface InfoCardData {
	id: string;
	anchorId?: string;
	image: string;
	category: string;
	date?: string;
	title: string;
	description: string;
	alt: string;
	content: React.ReactNode;
}

function InfoCardPreview({ card }: { card: InfoCardData }) {
	return (
		<>
			<div className="relative h-56 overflow-hidden">
				<div
					className="absolute inset-0 bg-cover bg-center"
					role="img"
					aria-label={card.alt}
					style={{ backgroundImage: `url("${card.image}")` }}
				/>
				<div className="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-foreground backdrop-blur-md dark:bg-black/80">
					{card.category}
				</div>
			</div>
			<div className="flex flex-1 flex-col p-6">
				{card.date ? (
					<div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
						<Calendar className="size-5" />
						<span>{card.date}</span>
					</div>
				) : null}
				<h3 className="mb-3 text-xl font-bold leading-snug text-card-foreground transition-colors group-hover:text-primary">
					{card.title}
				</h3>
				<p className="mb-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
					{card.description}
				</p>
				<span className="mt-auto inline-flex items-center text-sm font-bold text-primary">
					Dowiedz się więcej
				</span>
			</div>
		</>
	);
}

export function InfoCard({ card }: { card: InfoCardData }) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog.Root open={open} onOpenChange={setOpen}>
			<Dialog.Trigger asChild>
				<button
					type="button"
					className="group flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm"
				>
					<InfoCardPreview card={card} />
				</button>
			</Dialog.Trigger>

			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
				<Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex h-fit max-h-[90vh] w-[min(720px,92vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-3xl border border-border bg-background shadow-2xl">
					<div className="relative h-72 overflow-hidden">
						<div
							className="absolute inset-0 bg-cover bg-center"
							role="img"
							aria-label={card.alt}
							style={{ backgroundImage: `url("${card.image}")` }}
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
						<div className="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-foreground backdrop-blur-md dark:bg-black/80">
							{card.category}
						</div>
					</div>

					<div className="p-8">
						{card.date ? (
							<div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
								<Calendar className="size-5" />
								<span>{card.date}</span>
							</div>
						) : null}
						<Dialog.Title className="mb-2 text-2xl font-bold text-foreground">
							{card.title}
						</Dialog.Title>
						<Dialog.Description className="mb-6 text-muted-foreground">
							{card.description}
						</Dialog.Description>
						<div className="space-y-4 text-foreground">{card.content}</div>
					</div>

					<Dialog.Close asChild>
						<button
							type="button"
							className="absolute right-6 top-6 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:text-gray-900"
						>
							Zamknij
						</button>
					</Dialog.Close>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}

export function InfoCardGrid({ cards }: { cards: InfoCardData[] }) {
	return (
		<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
			{cards.map((card) => (
				<div
					key={card.id}
					id={card.anchorId}
					className="relative w-full scroll-mt-24"
					data-attraction-anchor={card.anchorId}
				>
					<InfoCard card={card} />
				</div>
			))}
		</div>
	);
}
