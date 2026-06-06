# TODO

## Step tracker
- [ ] (MVP) Stabilize billing MVP (card + mobile money): ensure frontend endpoints/payload keys match backend and fix mismatches.
- [ ] Verify `/api/subscription/` and `/api/billing/` responses match frontend `Billing.js` expectations.
- [ ] Ensure mobile money flow uses correct payload keys (`phoneNumber` vs `phone_number`, `plan` vs `plan_id`).
- [ ] Update `UpgradePlan.js` or other billing entry components to call correct plan selection endpoints and/or payment confirmation endpoints.
- [ ] Run backend + frontend and test: select plan -> pay card -> subscription updates; select plan -> mobile money -> verify -> subscription updates.
- [ ] (Next) Authentication MVP completion: email verification + forgot/reset password end-to-end.

