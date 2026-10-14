import "dotenv/config";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL belum diisi di file .env.");
const sql = postgres(url, { prepare: false });

async function main() {
  await sql.begin(async (tx) => {
    // Ensure the one canonical account exists and consolidate opening balances.
    const existing = await tx<{ total: string | number }>`
      SELECT COALESCE(SUM(opening_balance_idr), 0) AS total FROM cash_accounts
    `;
    const totalOpeningBalance = Number(existing[0]?.total ?? 0);

    await tx`
      INSERT INTO cash_accounts (id, name, opening_balance_idr, active)
      VALUES (1, 'Kas Rona', ${totalOpeningBalance}, TRUE)
      ON CONFLICT (id) DO UPDATE SET
        name = 'Kas Rona',
        opening_balance_idr = ${totalOpeningBalance},
        active = TRUE
    `;

    // Point all records to the canonical Kas Rona account before removing duplicates.
    await tx`UPDATE cash_transactions SET account_id = 1 WHERE account_id <> 1`;
    await tx`UPDATE expenses SET paid_from_account_id = 1 WHERE paid_from_account_id IS NOT NULL AND paid_from_account_id <> 1`;
    await tx`UPDATE other_income SET received_into_account_id = 1 WHERE received_into_account_id IS NOT NULL AND received_into_account_id <> 1`;
    await tx`DELETE FROM cash_accounts WHERE id <> 1`;

    // Keep the identity sequence above the canonical id.
    await tx`SELECT setval(pg_get_serial_sequence('cash_accounts', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM cash_accounts), 1), TRUE)`;

    // Legacy shared JSON workspace: force all historical transaction labels to the one cash account.
    await tx`
      UPDATE workspace_state
      SET payload = jsonb_set(
        payload,
        '{transactions}',
        COALESCE((
          SELECT jsonb_agg(jsonb_set(item, '{account}', '"Kas Rona"'::jsonb))
          FROM jsonb_array_elements(COALESCE(payload->'transactions', '[]'::jsonb)) AS t(item)
        ), '[]'::jsonb),
        TRUE
      ), updated_at = NOW()
      WHERE payload ? 'transactions'
    `;
  });

  console.log("Berhasil: semua akun kas digabung menjadi satu akun 'Kas Rona'. Referensi transaksi dan label historis telah dinormalisasi.");
}

main()
  .catch((error) => {
    console.error("Migrasi satu akun kas gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
