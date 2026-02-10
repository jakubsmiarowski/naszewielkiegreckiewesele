interface OverviewSectionProps {
	totals: {
		confirmed: number;
		declined: number;
		pending: number;
		bus: number;
		childrenTotal: number;
		accommodationHostProvided: number;
		accommodationSelfArranged: number;
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
			<div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
				<div className="text-3xl font-bold text-emerald-600">
					{totals.childrenTotal}
				</div>
				<div className="text-sm text-gray-500 mt-1">Dzieci (łącznie)</div>
			</div>
			<div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
				<div className="text-3xl font-bold text-indigo-600">
					{totals.accommodationHostProvided}
				</div>
				<div className="text-sm text-gray-500 mt-1">Nocleg od nas</div>
			</div>
			<div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
				<div className="text-3xl font-bold text-slate-700">
					{totals.accommodationSelfArranged}
				</div>
				<div className="text-sm text-gray-500 mt-1">
					Nocleg we własnym zakresie
				</div>
			</div>
		</div>
	);
}
