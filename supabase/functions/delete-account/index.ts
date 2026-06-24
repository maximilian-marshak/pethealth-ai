// ════════════════════════════════════════════════════════════════════
// supabase/functions/delete-account/index.ts
// Полное удаление аккаунта вызывающего пользователя: все его данные + сам
// auth-аккаунт. uid берётся ТОЛЬКО из проверенного JWT (никогда из тела).
// Service-role — из секрета окружения, не из клиента.
//
// Секреты (env): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
// (в Edge Functions эти три обычно инжектятся автоматически).
// ════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Рекурсивно собирает и удаляет все объекты бакета под префиксом (включая
// подпапки вида ${petId}/${recordId}/...). Не фатально — бросает наверх,
// вызывающий ловит и логирует.
async function removePrefix(admin: any, bucket: string, prefix: string): Promise<void> {
  const paths: string[] = [];

  async function walk(p: string): Promise<void> {
    const { data, error } = await admin.storage.from(bucket).list(p, { limit: 1000 });
    if (error) throw new Error(`list ${bucket}/${p}: ${error.message}`);
    for (const item of data ?? []) {
      const full = p ? `${p}/${item.name}` : item.name;
      // У "папок" id === null; у файлов — непустой id.
      if (item.id === null) {
        await walk(full);
      } else {
        paths.push(full);
      }
    }
  }

  await walk(prefix);

  if (paths.length) {
    const { error } = await admin.storage.from(bucket).remove(paths);
    if (error) throw new Error(`remove ${bucket}: ${error.message}`);
  }
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ success: false, error: "method not allowed" }, 405);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE || !ANON_KEY) {
    return json({ success: false, error: "server is not configured" }, 500);
  }

  // ── 1) Определяем пользователя ТОЛЬКО из проверенного JWT ──
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ success: false, error: "missing or invalid Authorization header" }, 401);
  }

  // Клиент с anon-ключом + JWT пользователя — только для auth.getUser().
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  const uid = userData?.user?.id;
  if (userErr || !uid) {
    return json({ success: false, error: "invalid or expired token" }, 401);
  }

  // Admin-клиент с service-role — для удаления (в обход RLS).
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    // ── 2) Список питомцев пользователя ──
    const { data: petsRows, error: petsErr } = await admin
      .from("pets")
      .select("id")
      .eq("owner_id", uid);
    if (petsErr) throw new Error(`pets.select: ${petsErr.message}`);
    const petIds: string[] = (petsRows ?? []).map((p: { id: string }) => p.id);

    // ── 3) Явные удаления по питомцам (там, где нет каскада) ──
    if (petIds.length) {
      // a. record_attachments (pet_id NO ACTION; record_id SET NULL → каскадом не уйдут)
      let r = await admin.from("record_attachments").delete().in("pet_id", petIds);
      if (r.error) throw new Error(`record_attachments: ${r.error.message}`);

      // b. conversations (pet_id NO ACTION; messages уйдут каскадом по conversation_id)
      r = await admin.from("conversations").delete().in("pet_id", petIds);
      if (r.error) throw new Error(`conversations: ${r.error.message}`);

      // c. medical_records (снесёт record_vaccines/prescriptions/lab_tests/parasite_treatments
      //    каскадом по record_id; закрывает NO ACTION medical_records.user_id)
      r = await admin.from("medical_records").delete().in("pet_id", petIds);
      if (r.error) throw new Error(`medical_records: ${r.error.message}`);
    }

    // ── 4) Питомцы (каскадом: activities, activity_logs, ai_analysis_history,
    //    appointments, medication_intakes, medications, pet_allergies, pet_conditions,
    //    reminders, vaccinations, vet_records, weight_history, weight_records) ──
    {
      const { error } = await admin.from("pets").delete().eq("owner_id", uid);
      if (error) throw new Error(`pets: ${error.message}`);
    }

    // ── 5) Баллы лояльности ──
    {
      const { error } = await admin.from("user_points").delete().eq("user_id", uid);
      if (error) throw new Error(`user_points: ${error.message}`);
    }

    // ── 6) Storage (не фатально: файлы вторичны) ──
    const safeRemove = async (bucket: string, prefix: string) => {
      try {
        await removePrefix(admin, bucket, prefix);
      } catch (se) {
        console.error(`storage cleanup ${bucket}/${prefix} failed (non-fatal):`, (se as Error)?.message);
      }
    };
    for (const petId of petIds) {
      await safeRemove("pets", String(petId));
      await safeRemove("medical-docs", String(petId));
    }
    await safeRemove("avatars", uid);

    // ── 7) Профиль public.users (charity_donations уйдёт каскадом) ──
    {
      const { error } = await admin.from("users").delete().eq("id", uid);
      if (error) throw new Error(`users: ${error.message}`);
    }

    // ── 8) Последним — сам auth-аккаунт ──
    {
      const { error } = await admin.auth.admin.deleteUser(uid);
      if (error) throw new Error(`auth.deleteUser: ${error.message}`);
    }

    return json({ success: true }, 200);
  } catch (err) {
    // Критичная ошибка БД/auth — останавливаемся, не оставляем полу-удаление
    // без снесённого auth (повторный вызов можно безопасно ретраить).
    console.error("delete-account failed:", (err as Error)?.message);
    return json({ success: false, error: (err as Error)?.message ?? "deletion failed" }, 500);
  }
});
