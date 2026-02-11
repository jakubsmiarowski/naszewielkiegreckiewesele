export type MainTabId =
	| "RSVP"
	| "Car Pool"
	| "Plan zabawy"
	| "Logistyka"
	| "Atrakcje"
	| "Q&A"
	| "Admin";

export const ATTRACTION_ANCHORS = {
	loutroSaturdayTrip: "atrakcje-loutro-sobota",
} as const;

export type AttractionAnchorId =
	(typeof ATTRACTION_ANCHORS)[keyof typeof ATTRACTION_ANCHORS];

export interface DashboardGuest {
	_id: string;
	fullName: string;
	relation?: string;
}

export interface RsvpInvitation {
	_id: string;
	attendance?: "yes" | "no";
	guestAttendances?: Record<string, "yes" | "no">;
	answeredForAll?: boolean;
	answeredForName?: string;
	transport?: "own" | "bus";
	carpoolDriverOptIn?: boolean;
	arrivalDateTime?: string;
	departureDateTime?: string;
	message?: string;
	plusOneName?: string;
	plusOneAttendance?: "yes" | "no";
	childrenCount?: number;
	childrenSleepOption?: "extraBed" | "crib";
	accommodationType?: "hostProvided" | "selfArranged";
	needsExtraNightsHelp?: boolean;
	extraNightsFromDate?: string;
	extraNightsToDate?: string;
	hasPlusOne: boolean;
}

export interface InvitationData {
	invitation: RsvpInvitation;
	guests: DashboardGuest[];
}

export interface AdminInvitation {
	_id: string;
	displayName: string;
	shortCode: string;
	qrToken: string;
	attendance?: "yes" | "no";
	guestAttendances?: Record<string, "yes" | "no">;
	answeredForAll?: boolean;
	answeredForName?: string;
	transport?: "own" | "bus";
	carpoolDriverOptIn?: boolean;
	arrivalDateTime?: string;
	departureDateTime?: string;
	plusOneName?: string;
	plusOneAttendance?: "yes" | "no";
	childrenCount?: number;
	childrenSleepOption?: "extraBed" | "crib";
	accommodationType?: "hostProvided" | "selfArranged";
	needsExtraNightsHelp?: boolean;
	extraNightsFromDate?: string;
	extraNightsToDate?: string;
	guests: DashboardGuest[];
}

export interface RsvpSettings {
	rsvpDeadline: string;
	rsvpGraceDeadline: string;
	carpoolDeadline: string;
}

export type CarpoolOfferStatus = "open" | "closed" | "cancelled";

export type CarpoolRequestStatus =
	| "pending"
	| "accepted"
	| "rejected"
	| "cancelled_by_passenger"
	| "cancelled_by_driver"
	| "cancelled_system";

export interface CarpoolDriverRequest {
	_id: string;
	passengerInvitationId: string;
	passengerDisplayName: string;
	seatsRequested: number;
	message?: string;
	mediationRequested: boolean;
	mediationResolvedAt?: number;
	status: CarpoolRequestStatus;
	respondedAt?: number;
	createdAt: number;
	updatedAt: number;
}

export interface CarpoolMyOffer {
	_id: string;
	pickupPoint?: string;
	dropoffPoint?: string;
	departureDateTime: string;
	seatsTotal: number;
	notes?: string;
	status: CarpoolOfferStatus;
	createdAt: number;
	updatedAt: number;
	seatsAccepted: number;
	seatsAvailable: number;
	requests: CarpoolDriverRequest[];
}

export interface CarpoolOpenOffer {
	_id: string;
	driverInvitationId: string;
	driverDisplayName: string;
	driverArrivalDateTime?: string;
	pickupPoint?: string;
	dropoffPoint?: string;
	departureDateTime: string;
	seatsTotal: number;
	notes?: string;
	status: CarpoolOfferStatus;
	seatsAccepted: number;
	seatsAvailable: number;
	myRequestId?: string;
	myRequestStatus?: CarpoolRequestStatus;
	myRequestSeats?: number;
}

export interface CarpoolMyRequest {
	_id: string;
	offerId: string;
	seatsRequested: number;
	message?: string;
	mediationRequested: boolean;
	mediationResolvedAt?: number;
	status: CarpoolRequestStatus;
	respondedAt?: number;
	createdAt: number;
	updatedAt: number;
	driverDisplayName: string;
	offer: {
		_id: string;
		pickupPoint?: string;
		dropoffPoint?: string;
		departureDateTime: string;
		seatsTotal: number;
		status: CarpoolOfferStatus;
	};
}

export interface CarpoolTabData {
	carpoolDeadline: string;
	isBeforeDeadline: boolean;
	canCreateOffer: boolean;
	canRequestRide: boolean;
	hasPendingRequest: boolean;
	passengerRequiredSeats: number;
	passengerSeatLimit: number;
	myOffers: CarpoolMyOffer[];
	openOffers: CarpoolOpenOffer[];
	myRequests: CarpoolMyRequest[];
}

export interface CarpoolMediationAlert {
	requestId: string;
	status: CarpoolRequestStatus;
	seatsRequested: number;
	createdAt: number;
	passengerInvitationId: string;
	passengerDisplayName: string;
	driverInvitationId: string;
	driverDisplayName: string;
	offerId: string;
	pickupPoint?: string;
	dropoffPoint?: string;
	departureDateTime: string;
}

export interface CarpoolAdminOverview {
	offers: Array<{
		_id: string;
		driverInvitationId: string;
		driverDisplayName: string;
		driverArrivalDateTime?: string;
		pickupPoint?: string;
		dropoffPoint?: string;
		departureDateTime: string;
		seatsTotal: number;
		status: CarpoolOfferStatus;
		seatsAccepted: number;
		seatsAvailable: number;
	}>;
	pendingRequests: Array<{
		_id: string;
		offerId: string;
		passengerDisplayName: string;
		seatsRequested: number;
		createdAt: number;
	}>;
}

export type QaQuestionStatus = "pending" | "answered";

export interface QaPublicQuestion {
	_id: string;
	askerDisplayName?: string;
	question: string;
	answer?: string;
	status: QaQuestionStatus;
	createdAt: number;
	answeredAt?: number;
}

export interface QaAdminQuestion extends QaPublicQuestion {
	invitationId?: string;
}
