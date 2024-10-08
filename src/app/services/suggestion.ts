import { Airport } from '../../data/index';

export function suggestion(queryString: string, airports: Airport[]): Airport[] | [] {
    if (queryString.length < 3) {
        return [];
    }

    return airports
        .filter(airport => 
            airport?.iata?.startsWith(queryString.toUpperCase()) ||  
            airport?.name?.toUpperCase().startsWith(queryString.toUpperCase())
        )

} 