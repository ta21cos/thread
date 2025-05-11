'use server';

// Define a serializable result type for server actions
// This is needed because ResultAsync has functions and cannot be passed to the client

/**
 * Serializable success result
 */
export type SerializableSuccess<T> = {
  success: true;
  data: T;
};

/**
 * Serializable error result
 */
export type SerializableError = {
  success: false;
  error: {
    message: string;
    cause?: unknown;
  };
};

/**
 * Serializable result type that can be returned from server actions
 * and safely passed to clients
 */
export type SerializableResult<T> = SerializableSuccess<T> | SerializableError;
