# SpendLens Parser Specification

Transaction Creation Rules

Create transaction:

- debit completed
- credit completed
- refund completed
- reversal completed
- card spend completed
- UPI success

Do NOT create transaction:

- pending
- failed
- declined
- OTP
- statement generated
- reward points
- card limit alerts
- bill reminders
- mandate registration only

Definition:

A transaction exists only when money movement is confirmed.
