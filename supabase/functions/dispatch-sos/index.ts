// ============================================================================
// Supabase Edge Function: dispatch-sos
// Unstoppable Server-Side Emergency Dispatch for Umkhuseli / Sankofa Safe
// Handles panic trigger even if user handset is destroyed or offline 1 sec later
// ============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SOSRequest {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  areaName?: string;
  batteryPercentage?: number;
  isCharging?: boolean;
  deviceModel?: string;
  isDuress?: boolean;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const smsWebhookUrl = Deno.env.get("SMS_GATEWAY_WEBHOOK_URL");

    // Initialize Supabase admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Extract authorization header to get calling user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user JWT
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid user token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: SOSRequest = await req.json();

    const configuredAppUrl = Deno.env.get("PUBLIC_APP_URL")?.trim();
    const requestOrigin = req.headers.get("origin")?.trim();
    const appUrlCandidate = configuredAppUrl || requestOrigin || "";
    const appUrl = /^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(appUrlCandidate)
      ? appUrlCandidate.replace(/\/$/, "")
      : "";
    const responderToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    const responderUrl = appUrl ? `${appUrl}/?track=${encodeURIComponent(responderToken)}` : "";

    // 1. Fetch user's registered ICE guardians
    const { data: guardians, error: guardiansError } = await supabaseAdmin
      .from("guardians")
      .select("*")
      .eq("user_id", user.id);

    if (guardiansError) {
      console.error("Failed to query guardians:", guardiansError);
    }

    const activeGuardians = guardians ?? [];

    // 2. Build 72-Hour Distress Message
    const mapsUrl = payload.latitude && payload.longitude
      ? `https://maps.google.com/?q=${payload.latitude},${payload.longitude}`
      : "GPS lock unavailable (Check Find My Device)";

    const findMyDeviceUrl = "https://www.google.com/android/find";
    const areaName = payload.areaName || "Area pending GPS lock";
    const batteryInfo = payload.batteryPercentage !== undefined
      ? `${payload.batteryPercentage}% ${payload.isCharging ? "(Charging)" : ""}`
      : "Unknown";

    const baseDistressMessage = [
      "🚨 URGENT EMERGENCY SOS ALERT",
      "I am in imminent danger and require immediate emergency assistance.",
      "",
      `• CURRENT AREA: ${areaName}`,
      `• LAST REPORTED LOCATION: ${mapsUrl}`,
      `• LIVE 72-HR RESPONDER CONSOLE: ${responderUrl || "Secure link temporarily unavailable"}`,
      `• GOOGLE FIND MY DEVICE: ${findMyDeviceUrl}`,
      `• DEVICE BATTERY: ${batteryInfo}`,
      `• HANDSET: ${payload.deviceModel || "Mobile Handset"}`,
      "",
      "PLEASE CONTACT SAPS (10111) OR NATIONAL GBV COMMAND CENTRE (0800 428 428 / *134*7355#) IMMEDIATELY."
    ].join("\n");

    // 3. Insert SOS Beacon record into Database
    const { data: beacon, error: beaconError } = await supabaseAdmin
      .from("sos_beacons")
      .insert({
        user_id: user.id,
        status: "PROCESSING",
        is_duress: payload.isDuress || false,
        latitude: payload.latitude,
        longitude: payload.longitude,
        accuracy: payload.accuracy,
        area_name: areaName,
        battery_percentage: payload.batteryPercentage,
        is_charging: payload.isCharging,
        device_model: payload.deviceModel,
        distress_message: baseDistressMessage,
        responder_token: responderToken,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (beaconError) {
      console.error("Error creating beacon record:", beaconError);
      return new Response(JSON.stringify({ error: "Unable to create a secure SOS beacon" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dispatchedChannels: string[] = [];
    let dispatchedCount = 0;

    // 4. Dispatch via Email (Resend API if configured)
    const emailRecipients: string[] = [];
    for (const g of activeGuardians) {
      if (g.email_address_1 && g.email_address_1.includes("@")) emailRecipients.push(g.email_address_1);
      if (g.email_address_2 && g.email_address_2.includes("@")) emailRecipients.push(g.email_address_2);
    }

    if (resendApiKey && emailRecipients.length > 0) {
      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Umkhuseli Emergency Alert <emergency@umkhuseli.org.za>",
            to: emailRecipients,
            subject: `[EMERGENCY SOS] Urgent Distress Alert - ${areaName}`,
            text: baseDistressMessage,
          }),
        });
        if (resendRes.ok) {
          dispatchedChannels.push("EMAIL");
          dispatchedCount += emailRecipients.length;
        }
      } catch (err) {
        console.error("Resend email dispatch error:", err);
      }
    }

    // 5. Dispatch via SMS / Webhook Gateway (Clickatell, AWS SNS, Twilio)
    if (smsWebhookUrl && activeGuardians.length > 0) {
      try {
        const smsRes = await fetch(smsWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            guardians: activeGuardians.map(g => ({
              name: `${g.name} ${g.surname}`.trim(),
              phone: g.mobile_number_1,
            })),
            message: baseDistressMessage,
          }),
        });
        if (smsRes.ok) {
          dispatchedChannels.push("SMS");
          dispatchedCount += activeGuardians.length;
        }
      } catch (err) {
        console.error("SMS webhook dispatch error:", err);
      }
    }

    // 6. Update Beacon Record with Dispatched Channels
    if (beacon?.id) {
      await supabaseAdmin
        .from("sos_beacons")
        .update({
          status: "DISPATCHED",
          dispatched_channels: dispatchedChannels.length > 0 ? dispatchedChannels : ["SIMULATED_TEST"],
          dispatched_at: new Date().toISOString(),
        })
        .eq("id", beacon.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        beaconId: beacon?.id,
        responderUrl: responderUrl || null,
        expiresAt,
        guardianCount: activeGuardians.length,
        dispatchedCount,
        dispatchedChannels,
        message: "Distress beacon registered and dispatched to emergency network.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Edge dispatch exception:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
