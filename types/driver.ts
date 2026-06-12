export interface Driver {
    id: string;
    name: string;
    rating: number;
    distance: number;
    eta: number;
    availability: boolean;
    acceptanceRate: number;
    vehicle: string;
}
