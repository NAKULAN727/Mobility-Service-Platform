// ─── Centralized GraphQL Mutation Strings ─────────────────────────────────────
// Import these in pages instead of re-declaring inline on each file.

export const CREATE_BOOKING_MUTATION = `
  mutation CreateBooking($input: BookingCreateInput!) {
    createBooking(input: $input) {
      success
      errors { field message code }
      booking {
        id
        customerId
        driverId
        vehicleId
        bookingType
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
  }
`;

export const CANCEL_BOOKING_MUTATION = `
  mutation CancelBooking($bookingId: ID!, $reason: String) {
    cancelBooking(bookingId: $bookingId, reason: $reason) {
      success
      errors { field message code }
      booking {
        id
        bookingStatus
        vehicleId
        payment { paymentStatus }
      }
    }
  }
`;

export const ACCEPT_BOOKING_MUTATION = `
  mutation AcceptBooking($bookingId: ID!, $driverId: ID!) {
    acceptBooking(bookingId: $bookingId, driverId: $driverId) {
      success
      errors { field message code }
      booking {
        id
        bookingStatus
        driverId
        updatedAt
      }
    }
  }
`;

export const START_TRIP_MUTATION = `
  mutation StartTrip($bookingId: ID!, $otpCode: String!) {
    startTrip(bookingId: $bookingId, otpCode: $otpCode) {
      success
      errors { field message code }
      booking {
        id
        bookingStatus
        actualStartTime
        updatedAt
      }
    }
  }
`;

export const COMPLETE_TRIP_MUTATION = `
  mutation CompleteTrip($bookingId: ID!) {
    completeTrip(bookingId: $bookingId) {
      success
      errors { field message code }
      booking {
        id
        bookingStatus
        actualEndTime
        payment { paymentStatus transactionId }
        updatedAt
      }
    }
  }
`;

export const CREATE_PAYMENT_MUTATION = `
  mutation CreatePayment($input: PaymentCreateInput!) {
    createPayment(input: $input) {
      success
      errors { field message code }
      payment {
        id
        bookingId
        amount
        paymentMethod
        paymentStatus
        transactionId
        createdAt
      }
    }
  }
`;

export const UPDATE_PAYMENT_STATUS_MUTATION = `
  mutation UpdatePaymentStatus($paymentId: ID!, $status: PaymentStatus!) {
    updatePaymentStatus(paymentId: $paymentId, status: $status) {
      success
      errors { field message code }
      payment {
        id
        paymentStatus
        transactionId
        updatedAt
      }
    }
  }
`;

export const ADD_VEHICLE_MUTATION = `
  mutation AddVehicle($input: VehicleCreateInput!) {
    addVehicle(input: $input) {
      success
      errors { field message code }
      vehicle {
        id
        vehicleNumber
        vehicleType
        model
        seatingCapacity
        availabilityStatus
        createdAt
      }
    }
  }
`;

export const UPDATE_VEHICLE_MUTATION = `
  mutation UpdateVehicle($id: ID!, $input: VehicleUpdateInput!) {
    updateVehicle(id: $id, input: $input) {
      success
      errors { field message code }
      vehicle {
        id
        vehicleNumber
        vehicleType
        model
        seatingCapacity
        availabilityStatus
        updatedAt
      }
    }
  }
`;

export const DELETE_VEHICLE_MUTATION = `
  mutation DeleteVehicle($id: ID!) {
    deleteVehicle(id: $id) {
      success
      errors { field message code }
      vehicle { id vehicleNumber model }
    }
  }
`;
