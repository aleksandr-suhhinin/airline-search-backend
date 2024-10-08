## Task Overview

An HTTP API endpoint was developed to calculate the shortest route between two airports, given their IATA/ICAO codes, with the following requirements:

- **Main Task**: Find the shortest route consisting of at most 4 legs (flights).
- **Bonus Feature**: Optionally allow ground transfers between airports within 100km of each other. These ground transfers do not count toward the leg limit but are included in the total distance.

## Implementation Summary

- **Shortest Route Calculation**:
  - Implemented **Dijkstra's algorithm** to find the shortest path between airports, optimizing for minimal total distance.
  - Used a **priority queue** to avoid recursion and manage the exploration of airports efficiently.
  - Enforced a maximum of 4 legs by tracking the number of hops during the search and discarding paths that exceed this limit.

- **Ground Transfers**:
  - Extended the algorithm to include ground transfers when the `with-ground-hops` query parameter is provided.
  - Ground transfers are allowed between airports within 100km and do not increase the leg count but add to the total distance.
  - Ensured ground transfers are not consecutive, as per the requirements.

- **Data Structures**:
  - Used a **graph represented by a `Map`** to efficiently store and access airports and routes.
  - Implemented a **priority queue** to select the next airport to explore based on the shortest cumulative distance.

- **Performance Optimizations**:
  - **Caching Nearby Airports**: Implemented a cache (`Map<string, NearbyAirport[]>`) to store nearby airports for each airport, reducing redundant distance calculations during ground transfer evaluations.
  - **Efficient Priority Queue**: used a **heap-based priority queue** (with `js-priority-queue` library) to improve performance for larger datasets by reducing the time complexity of queue operations.

- **API Endpoint**:
  - Created an endpoint that accepts source and destination airport codes and returns a JSON response containing:
    - The sequence of airports in the route (`hops`).
    - The total distance of the route (`distance`), including any ground transfers.
    - Source and destination airport codes.

## Rationale Behind Choices

- **Dijkstra's Algorithm**: Selected for its effectiveness in finding the shortest paths in graphs with non-negative edge weights, making it suitable for minimizing travel distances between airports.

- **Leg Limit Constraint**: Integrated directly into the search algorithm to ensure all returned routes comply with the maximum of 4 legs.

- **Optional Ground Transfers**:
  - Made ground transfers an opt-in feature to keep the default route calculations straightforward and efficient for users who don't require ground hops.
  - This approach maintains performance while providing additional functionality when requested.

- **Caching and Performance**:
  - Caching nearby airports significantly improves performance by avoiding repeated distance calculations between airports during ground transfer checks.
  - Using efficient data structures like a heap-based priority queue enhances scalability and speed, especially with large numbers of airports and routes.

- **Data Access Efficiency**:
  - Using `Map` structures for airports and routes allows for constant-time access to necessary data, which is crucial for performance in algorithms that require frequent lookups.

By focusing on efficient algorithms and data structures, the service meets the requirements of calculating the shortest route within the specified constraints while maintaining good performance and scalability.

## Side improvements

- **Controller:**
    - The validation logic for airport codes was moved from the controllers to middleware. This helped avoid code duplication and improved readability and maintainability. Now, the controllers are cleaner, focusing solely on business logic, while the middleware handles the validation of incoming data.

- **Dockerfile:**
    - Fixed the test execution using the command `docker-compose up test`. Runninng `docker-compose up test` received an error:
    `app.test.ts:1:26 - error TS2307: Cannot find module 'supertest' or its corresponding type declarations.`
    Changes were made to the `Dockerfile` and `docker-compose.yml` to ensure that all dependencies, including `devDependencies` needed for testing, are installed. This allowed tests to run successfully inside the Docker container without errors related to missing modules.