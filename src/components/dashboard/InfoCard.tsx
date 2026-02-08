import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { Dialog } from "radix-ui";
import {
	forwardRef,
	useState,
	type ComponentPropsWithoutRef,
	type ElementRef,
} from "react";
import { Drawer } from "vaul";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";

export interface InfoCardData {
	id: string;
	image: string;
	category: string;
	date?: string;
	title: string;
	description: string;
	alt: string;
	content: React.ReactNode;
}

const CardBody = ({
	withMotionImage,
	card,
}: {
	withMotionImage: boolean;
	card: InfoCardData;
}) => (
	<>
		<div className="relative h-56 overflow-hidden">
			{withMotionImage ? (
				<motion.div
					layoutId={`card-image-${card.id}`}
					className="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-700"
					role="img"
					aria-label={card.alt}
					style={{ backgroundImage: `url("${card.image}")` }}
				/>
			) : (
				<div
					className="absolute inset-0 bg-cover bg-center"
					role="img"
					aria-label={card.alt}
					style={{ backgroundImage: `url("${card.image}")` }}
				/>
			)}
			<div className="absolute top-4 left-4 bg-white/90 dark:bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-foreground">
				{card.category}
			</div>
		</div>
		<div className="p-6 flex flex-col flex-1">
			{card.date && (
				<div className="flex items-center gap-2 mb-3 text-muted-foreground text-sm">
					<Calendar className="size-5" />
					<span>{card.date}</span>
				</div>
			)}
			<h3 className="text-xl font-bold text-card-foreground mb-3 leading-snug group-hover:text-primary transition-colors">
				{card.title}
			</h3>
			<p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
				{card.description}
			</p>
			<span className="mt-auto inline-flex items-center text-primary font-bold text-sm">
				Dowiedz się więcej
			</span>
		</div>
	</>
);

const MotionButton = forwardRef<
	ElementRef<typeof motion.button>,
	ComponentPropsWithoutRef<typeof motion.button>
>((props, ref) => <motion.button ref={ref} {...props} />);

MotionButton.displayName = "MotionButton";

const MotionDiv = forwardRef<
	ElementRef<typeof motion.div>,
	ComponentPropsWithoutRef<typeof motion.div>
>((props, ref) => <motion.div ref={ref} {...props} />);

MotionDiv.displayName = "MotionDiv";

export function InfoCard({ card }: { card: InfoCardData }) {
	const isMobile = useMediaQuery("(max-width: 768px)");
	const [open, setOpen] = useState(false);
	const layoutTransition = {
		type: "spring",
		stiffness: 520,
		damping: 42,
		mass: 0.8,
	};

	const trigger = (
		<MotionButton
			layoutId={`card-${card.id}`}
			type="button"
			className="group flex flex-col bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-border text-left w-full"
			style={{ opacity: open ? 0 : 1 }}
			transition={layoutTransition}
		>
			<CardBody withMotionImage card={card} />
		</MotionButton>
	);

	if (isMobile) {
		return (
			<div className="relative w-full">
				{open && (
					<div className="absolute inset-0 pointer-events-none" aria-hidden>
						<div className="group flex flex-col bg-card rounded-2xl overflow-hidden shadow-sm border border-border text-left w-full h-full">
							<CardBody withMotionImage={false} card={card} />
						</div>
					</div>
				)}
				<Drawer.Root open={open} onOpenChange={setOpen}>
					<Drawer.Trigger asChild>{trigger}</Drawer.Trigger>
					<Drawer.Portal>
						<Drawer.Overlay className="fixed inset-0 z-50 bg-black/50" />
						<Drawer.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-background p-6 shadow-2xl">
							<div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />
							<h3 className="text-2xl font-bold text-foreground mb-2">
								{card.title}
							</h3>
							<p className="text-muted-foreground mb-4">{card.description}</p>
							<div className="space-y-4 text-foreground">{card.content}</div>
						</Drawer.Content>
					</Drawer.Portal>
				</Drawer.Root>
			</div>
		);
	}

	return (
		<div className="relative w-full">
			{open && (
				<div className="absolute inset-0 pointer-events-none" aria-hidden>
					<div className="group flex flex-col bg-card rounded-2xl overflow-hidden shadow-sm border border-border text-left w-full h-full">
						<CardBody withMotionImage={false} card={card} />
					</div>
				</div>
			)}
			<Dialog.Root open={open} onOpenChange={setOpen}>
				<Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
				<Dialog.Portal forceMount>
					<AnimatePresence>
						{open && (
							<>
								<Dialog.Overlay asChild>
									<MotionDiv
										className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.18 }}
									/>
								</Dialog.Overlay>
								<Dialog.Content asChild>
									<MotionDiv
										layoutId={`card-${card.id}`}
										className={cn(
											"fixed left-1/2 top-1/2 z-50 w-[min(720px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-background shadow-2xl overflow-hidden",
										)}
										transition={layoutTransition}
									>
										<div className="relative h-72 overflow-hidden">
											<motion.div
												layoutId={`card-image-${card.id}`}
												className="absolute inset-0 bg-cover bg-center"
												role="img"
												aria-label={card.alt}
												style={{ backgroundImage: `url("${card.image}")` }}
												transition={layoutTransition}
											/>
											<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
										</div>
										<motion.div
											className="p-8"
											initial={{ opacity: 0, y: 8 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: 8 }}
											transition={{ duration: 0.2 }}
										>
											<Dialog.Title className="text-2xl font-bold text-foreground mb-2">
												{card.title}
											</Dialog.Title>
											<Dialog.Description className="text-muted-foreground mb-6">
												{card.description}
											</Dialog.Description>
											<div className="space-y-4 text-foreground">
												{card.content}
											</div>
										</motion.div>
										<Dialog.Close className="absolute right-6 top-6 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-gray-700 hover:text-gray-900 transition">
											Zamknij
										</Dialog.Close>
									</MotionDiv>
								</Dialog.Content>
							</>
						)}
					</AnimatePresence>
				</Dialog.Portal>
			</Dialog.Root>
		</div>
	);
}

export function InfoCardGrid({ cards }: { cards: InfoCardData[] }) {
	return (
		<LayoutGroup>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				{cards.map((card) => (
					<InfoCard key={card.id} card={card} />
				))}
			</div>
		</LayoutGroup>
	);
}
