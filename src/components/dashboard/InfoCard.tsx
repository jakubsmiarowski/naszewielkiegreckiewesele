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

function InfoCardMedia({
	card,
	showImage,
	onImageError,
	expandOnHover = false,
}: {
	card: InfoCardData;
	showImage: boolean;
	onImageError: () => void;
	expandOnHover?: boolean;
}) {
	if (showImage) {
		return (
			<img
				src={card.image}
				alt={card.alt}
				className={`absolute inset-0 h-full w-full object-cover bg-muted ${expandOnHover ? "transform transition-transform duration-700 group-hover:scale-105" : ""}`}
				loading="lazy"
				onError={onImageError}
			/>
		);
	}

	return (
		<div className="absolute inset-0 flex items-center justify-center bg-muted px-4 text-center text-sm font-medium text-muted-foreground">
			Zdjęcie wkrótce
		</div>
	);
}

function InfoCardPreview({
	card,
	showImage,
	onImageError,
}: {
	card: InfoCardData;
	showImage: boolean;
	onImageError: () => void;
}) {
	return (
		<>
			<div className="relative h-56 overflow-hidden">
				<InfoCardMedia
					card={card}
					showImage={showImage}
					onImageError={onImageError}
					expandOnHover
				/>
				<div className="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-foreground backdrop-blur-md dark:bg-black/80">
					{card.category}
				</div>
			</div>
			<div className="flex flex-1 flex-col p-4 sm:p-6">
				{card.date ? (
					<div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
						<Calendar className="size-5" />
						<span>{card.date}</span>
					</div>
				) : null}
				<h3 className="mb-3 text-lg font-bold leading-snug text-card-foreground transition-colors group-hover:text-primary sm:text-xl">
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
	const [imageFailed, setImageFailed] = useState(false);
	const hasImage = card.image.trim().length > 0;
	const showImage = hasImage && !imageFailed;

	const handleImageError = () => {
		setImageFailed(true);
	};

	return (
		<Dialog.Root open={open} onOpenChange={setOpen}>
			<Dialog.Trigger asChild>
				<button
					type="button"
					className="group flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm"
				>
					<InfoCardPreview
						card={card}
						showImage={showImage}
						onImageError={handleImageError}
					/>
				</button>
			</Dialog.Trigger>

			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
				<Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex h-fit max-h-[90vh] w-[min(720px,92vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl sm:rounded-3xl">
					<div className="relative h-56 overflow-hidden sm:h-72">
						<InfoCardMedia
							card={card}
							showImage={showImage}
							onImageError={handleImageError}
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
						<div className="absolute inset-x-0 top-0 z-20 flex w-full justify-between p-4 sm:p-6">
							<div className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-foreground backdrop-blur-md dark:bg-black/80">
								{card.category}
							</div>
							<Dialog.Close asChild>
								<button
									type="button"
									className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-foreground backdrop-blur-md transition hover:bg-white dark:bg-black/80"
								>
									Zamknij
								</button>
							</Dialog.Close>
						</div>
					</div>

					<div className="p-5 sm:p-8">
						{card.date ? (
							<div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
								<Calendar className="size-5" />
								<span>{card.date}</span>
							</div>
						) : null}
						<Dialog.Title className="mb-2 text-xl font-bold text-foreground sm:text-2xl">
							{card.title}
						</Dialog.Title>
						<Dialog.Description className="mb-5 text-sm leading-relaxed text-muted-foreground sm:mb-6 sm:text-base">
							{card.description}
						</Dialog.Description>
						<div className="space-y-4 text-foreground">{card.content}</div>
					</div>
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
