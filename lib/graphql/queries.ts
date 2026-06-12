// ─── Centralized GraphQL Query Strings ────────────────────────────────────────
// Import these in pages instead of re-declaring inline on each file.

export const GET_AVAILABLE_VEHICLES_QUERY = `
  query GetAvailableVehicles($type: VehicleType, $minCapacity: Int, $limit: Int, $offset: Int) {
    getAvailableVehicles(type: $type, minCapacity: $minCapacity, limit: $limit, offset: $offset) {
      id
      registrationNumber
      make
      vehicleType
      model
      seatingCapacity
      availabilityStatus
      createdAt
      updatedAt
    }
  }
`;

export const GET_VEHICLE_BY_ID_QUERY = `
  query GetVehicleById($id: ID!) {
    getVehicleById(id: $id) {
      id
      registrationNumber
      make
      vehicleType
      model
      seatingCapacity
      availabilityStatus
      createdAt
      updatedAt
    }
  }
`;

export const GET_BOOKING_BY_ID_QUERY = `
  query GetBookingById($id: ID!) {
    getBookingById(id: $id) {
      id
      customerId
      driverId
      vehicleId
      serviceType
      bookingStatus
      bookingDate
      bookingTime
      fareAmount
      otpCode
      actualStartTime
      actualEndTime
      location {
        id
        pickupLocation
        destinationLocation
        distance
        estimatedDuration
      }
      payment {
        id
        amount
        paymentMethod
        paymentStatus
        transactionId
        createdAt
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_BOOKING_HISTORY_QUERY = `
  query GetBookingHistory($customerId: ID!, $first: Int, $after: String, $last: Int, $before: String) {
    getBookingHistory(customerId: $customerId, first: $first, after: $after, last: $last, before: $before) {
      edges {
        node {
          id
          customerId
          driverId
          vehicleId
          serviceType
          bookingStatus
          bookingDate
          bookingTime
          fareAmount
          otpCode
          actualStartTime
          actualEndTime
          location {
            pickupLocation
            destinationLocation
            distance
            estimatedDuration
          }
          payment {
            id
            amount
            paymentMethod
            paymentStatus
            transactionId
          }
          createdAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

export const GET_ALL_BOOKINGS_QUERY = `
  query GetAllBookings($limit: Int, $offset: Int) {
    getAllBookings(limit: $limit, offset: $offset) {
      id
      customerId
      driverId
      vehicleId
      serviceType
      bookingStatus
      bookingDate
      bookingTime
      fareAmount
      otpCode
      location {
        pickupLocation
        destinationLocation
        distance
        estimatedDuration
      }
      payment {
        paymentMethod
        paymentStatus
        transactionId
      }
      createdAt
    }
  }
`;

export const GET_ACTIVE_BOOKINGS_QUERY = `
  query GetActiveBookings {
    getActiveBookings {
      id
      customerId
      driverId
      serviceType
      bookingStatus
      bookingDate
      bookingTime
      fareAmount
      location {
        pickupLocation
        destinationLocation
        distance
      }
      createdAt
    }
  }
`;

export const GET_PAYMENT_DETAILS_QUERY = `
  query GetPaymentDetails($bookingId: ID!) {
    getPaymentDetails(bookingId: $bookingId) {
      id
      bookingId
      amount
      paymentMethod
      paymentStatus
      transactionId
      createdAt
      updatedAt
    }
  }
`;

export const ESTIMATE_FARE_QUERY = `
  query EstimateFare($distanceKm: Float!, $vehicleType: VehicleType!, $serviceType: ServiceType!) {
    estimateFare(distanceKm: $distanceKm, vehicleType: $vehicleType, serviceType: $serviceType) {
      baseFare
      distanceFare
      serviceFee
      totalFare
      ratePerKm
      distanceKm
      estimatedDurationMin
      vehicleType
      serviceType
    }
  }
`;
