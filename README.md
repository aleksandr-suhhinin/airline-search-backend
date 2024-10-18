# airline-search-backend
## Backend for airlines search

### Dijkstra algorithm to search in graph
An HTTP API endpoint has been developed that accepts two airport codes (IATA) or names as input and returns the optimal route between them in JSON format. 
The route consists of no more than four flight segments (i.e., a maximum of three layovers) and is the shortest in terms of total geographical distance measured in kilometers. Dijkstra's algorithm was used to calculate the optimal route.

The service is already configured with data from [OpenFlights](https://openflights.org/data.html)

To run, take a look here: [airlines-search](https://github.com/aleksandr-suhhinin/airlines-search)
