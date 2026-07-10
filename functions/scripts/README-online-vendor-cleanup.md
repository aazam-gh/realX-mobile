# Online vendor legacy cleanup

Run from `realX-mobile/functions` after the unlimited compatibility functions,
Firestore rules, indexes, and TTL policy are deployed.

```sh
npm run cleanup:online-vendors -- --project reelx-backend
```

Review the three counts. To permanently delete the legacy documents and remove
the stale limit fields, rerun within 24 hours:

```sh
npm run cleanup:online-vendors -- --project reelx-backend --execute --confirm-delete-online-vendor-history
```

The execute mode re-queries Firestore after the bulk write and fails unless all
three remaining counts are zero. Reapply
`realX-web/functions/bigquery/transactions_admin_v1.sql`, then verify:

```sh
bq query --use_legacy_sql=false \
  'SELECT COUNT(*) AS online_rows FROM `reelx-backend.firestore_export.transactions_admin_v1` WHERE type = "online_redemption"'
```

The expected result is `0` even if the raw export retains historical rows.
