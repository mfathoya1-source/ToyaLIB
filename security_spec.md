# Security Specification & Payload-First TDD (`security_spec.md`)

## 1. Data Invariants
1. **Identity Integrity**: A `usersPublic/{userId}` or `usersPrivate/{userId}` document can only be created by the authenticated user matching `userId` (`request.auth.uid == userId`), and non-admin users cannot self-assign `role: "admin"`.
2. **PII Isolation**: Email addresses and member codes in `usersPrivate`, `loans`, and `emailNotifications` are never readable by other non-admin members (`resource.data.memberId == request.auth.uid || isAdmin()` / `resource.data.recipientId == request.auth.uid || isAdmin()`).
3. **Atomic Loan & Stock Synchronization**: A member cannot decrement or increment `books/{bookId}.availableCopies` without an atomic batch creating/updating a matching `loans/{loanId}` document verified via `getAfter()`.
4. **Terminal State Locking**: Once `loans/{loanId}.status` becomes `"returned"`, a non-admin member cannot mutate the loan record again.
5. **Temporal Integrity**: All `createdAt`, `updatedAt`, `joinedAt`, `borrowedAt`, `returnedAt`, and `sentAt` timestamps on write must match `request.time`.
6. **Path Variable Hardening**: Every single-document path ID (`userId`, `bookId`, `loanId`, `activityId`, `notificationId`, `reportId`) must match `^[a-zA-Z0-9_\-]+$` and be `<= 128` characters.

## 2. The "Dirty Dozen" Payloads (Expected: `PERMISSION_DENIED`)
1. **Self-Admin Escalation**: Member creates `usersPublic/{uid}` with `{ role: "admin" }`.
2. **Ghost Field Shadow Write**: Member creates `loans/{loanId}` with extra undocumented field `{ isApprovedOverride: true }`.
3. **Cross-User PII Read**: Member A attempts `get` or `list` on `usersPrivate/{memberB}` or `loans` belonging to Member B.
4. **Unverified Email Spoof**: User with `email: "mfathoya1@gmail.com"` and `email_verified: false` attempts admin write on `books/{bookId}`.
5. **Orphaned Loan Creation**: Member creates `loans/{loanId}` referencing non-existent `bookId: "nonexistent-book"`.
6. **Impersonated Borrow**: Member A creates `loans/{loanId}` with `memberId: "memberB"`.
7. **Unbacked Stock Manipulation**: Member updates `books/{bookId}` `availableCopies` without a matching atomic `loans/{lastLoanId}` write verified by `getAfter()`.
8. **Mutating Returned Loan**: Member updates `loans/{loanId}` after `status` is already `"returned"`.
9. **Spoofed Timestamp**: Member creates `loans/{loanId}` with client-forged `borrowedAt` instead of `request.time`.
10. **Excessive Renewal Bypass**: Member updates `loans/{loanId}` to `renewalCount: 99` or modifies `memberId`.
11. **ID Poisoning**: Client writes to `books/` with a 500-character ID containing invalid symbols (`../admin`).
12. **Member Generating Official Report**: Non-admin member attempts to write to `reports/{reportId}` or `admins/{uid}`.
