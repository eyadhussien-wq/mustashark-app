# ADR — S01-02 Booking Reference

## Decision
Every consultation booking receives a server-generated, immutable human-readable reference at creation time.

The existing database field `bookings.serial_number` is the canonical persisted reference. The API exposes the same value as `referenceNumber` so clients, lawyers, and admin surfaces can use one stable reference without exposing internal UUIDs as the primary human identifier.

## Rules

- Generated only by the server.
- Required and unique in the database.
- Never accepted from the client request payload.
- Never changed during the booking lifecycle.
- Never reused for another booking.
- Available in booking creation responses.
- Suitable for support, notifications, audit correlation, and admin search.

## Format

Current format: `BK-<timestamp>-<random>`.

The database unique constraint is authoritative for collision prevention. Internal UUID `bookings.id` remains the technical primary key and is not replaced.

## Scope

This decision applies to all booking creation paths. Both the safe scheduling controller and the legacy booking controller already generate `serialNumber` server-side; the API contract now exposes it consistently as `referenceNumber`.
