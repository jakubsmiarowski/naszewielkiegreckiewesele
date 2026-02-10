interface OverviewSectionProps {
	totals: {
		confirmed: number;
		declined: number;
		pending: number;
		bus: number;
	};
}

export function OverviewSection({ totals }: OverviewSectionProps) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
			<div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
				<div className="text-3xl font-bold text-[var(--color-primary)]">
					{totals.confirmed}
				</div>
				<div className="text-sm text-gray-500 mt-1">Potwierdzeni</div>
			</div>
			<div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
				<div className="text-3xl font-bold text-red-500">{totals.declined}</div>
				<div className="text-sm text-gray-500 mt-1">Odmowy</div>
			</div>
			<div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
				<div className="text-3xl font-bold text-gray-700">{totals.pending}</div>
				<div className="text-sm text-gray-500 mt-1">Brak odpowiedzi</div>
			</div>
			<div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
				<div className="text-3xl font-bold text-blue-600">{totals.bus}</div>
				<div className="text-sm text-gray-500 mt-1">Transport (bus)</div>
			</div>
		</div>
	);
}
