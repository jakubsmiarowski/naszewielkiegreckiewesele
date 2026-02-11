import type { QaAdminQuestion } from "@/components/dashboard/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface QaSectionProps {
	qaQuestions?: QaAdminQuestion[];
	pendingQaCount: number;
	answerDrafts: Record<string, string>;
	savingQuestionId: string | null;
	expandedAnsweredIds: Record<string, boolean>;
	onToggleAnsweredCard: (questionId: string) => void;
	onAnswerDraftChange: (questionId: string, value: string) => void;
	onSaveAnswer: (questionId: string) => void;
}

export function QaSection({
	qaQuestions,
	pendingQaCount,
	answerDrafts,
	savingQuestionId,
	expandedAnsweredIds,
	onToggleAnsweredCard,
	onAnswerDraftChange,
	onSaveAnswer,
}: QaSectionProps) {
	return (
		<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
			<div className="flex flex-wrap items-center justify-between gap-3 mb-4">
				<h3 className="text-xl font-bold text-foreground">Q&A od gości</h3>
				<Badge
					variant={pendingQaCount > 0 ? "destructive" : "secondary"}
					className="font-semibold"
				>
					Oczekujące: {pendingQaCount}
				</Badge>
			</div>
			{!qaQuestions ? (
				<p className="text-muted-foreground">Ładowanie pytań...</p>
			) : qaQuestions.length === 0 ? (
				<p className="text-muted-foreground">Brak pytań od gości.</p>
			) : (
				<ul className="space-y-3">
					{qaQuestions.map((item) => {
						const isAnswered = item.status === "answered";
						const isExpanded = !isAnswered || expandedAnsweredIds[item._id];

						if (!isExpanded) {
							return (
								<li
									key={item._id}
									className="rounded-xl bg-[var(--color-background-light)] p-4"
								>
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="text-xs uppercase tracking-widest text-muted-foreground">
												Odpowiedziane
											</p>
											<p className="font-semibold text-foreground mt-1">
												{item.question}
											</p>
											<p className="text-xs text-muted-foreground mt-1">
												Od: {item.askerDisplayName ?? "Gość"} •{" "}
												{new Date(item.createdAt).toLocaleString("pl-PL")}
											</p>
										</div>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => onToggleAnsweredCard(item._id)}
											className="shrink-0 px-3 py-1.5 rounded-full border-[var(--color-primary)] text-[var(--color-primary)] text-xs font-semibold hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] transition h-auto"
										>
											Rozwiń
										</Button>
									</div>
								</li>
							);
						}

						return (
							<li
								key={item._id}
								className="rounded-xl bg-[var(--color-background-light)] p-4"
							>
								<div className="flex flex-wrap items-center justify-between gap-2">
									<p className="text-xs uppercase tracking-widest text-muted-foreground">
										{isAnswered ? "Odpowiedziane" : "Oczekujące"}
									</p>
									<div className="flex items-center gap-2">
										<p className="text-xs text-muted-foreground">
											{new Date(item.createdAt).toLocaleString("pl-PL")}
										</p>
										{isAnswered && (
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => onToggleAnsweredCard(item._id)}
												className="px-3 py-1 rounded-full border-[var(--color-primary)] text-[var(--color-primary)] text-xs font-semibold hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] transition h-auto"
											>
												Zwiń
											</Button>
										)}
									</div>
								</div>
								<p className="font-semibold text-foreground mt-2">
									{item.question}
								</p>
								<p className="text-xs text-muted-foreground mt-1">
									Od: {item.askerDisplayName ?? "Gość"}
								</p>
								<Textarea
									value={answerDrafts[item._id] ?? ""}
									onChange={(event) =>
										onAnswerDraftChange(item._id, event.target.value)
									}
									rows={3}
									placeholder="Wpisz odpowiedź dla gości..."
									className="mt-3 w-full rounded-xl bg-white px-3 py-2 text-sm text-foreground shadow-xs focus-visible:ring-[var(--color-primary)] border-input"
								/>
								<Button
									type="button"
									onClick={() => onSaveAnswer(item._id)}
									disabled={savingQuestionId === item._id}
									className="mt-3 px-4 py-2 rounded-full bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary)]/90 disabled:opacity-70 transition h-auto"
								>
									{savingQuestionId === item._id
										? "Zapisywanie..."
										: "Zapisz odpowiedź"}
								</Button>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
