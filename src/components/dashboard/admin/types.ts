export interface AdminUserRecord {
	_id: string;
	email: string;
	isActive: boolean;
	addedBy?: string;
	deactivatedBy?: string;
	deactivatedAt?: number;
	createdAt: number;
	updatedAt: number;
}

export type AdminSectionId =
	| "admins"
	| "deadlines"
	| "errors"
	| "carpool"
	| "qa"
	| "arrivals"
	| "departures"
	| "invitations";

export interface AdminSectionMeta {
	id: AdminSectionId;
	title: string;
	description: string;
	pendingCount?: number;
}
