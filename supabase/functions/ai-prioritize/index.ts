import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { request_id } = await req.json();
    if (!request_id) {
      return new Response(JSON.stringify({ error: "request_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch the request
    const { data: request, error: fetchError } = await supabase
      .from("maintenance_requests")
      .select("*")
      .eq("id", request_id)
      .single();

    if (fetchError || !request) {
      return new Response(JSON.stringify({ error: "Request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Call AI to analyze the request
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a maintenance request priority analyzer. Analyze the maintenance request and determine its priority and urgency score.

Consider:
- Safety risks (water leak, electrical issues, gas leak, fire hazard = HIGH/URGENT)
- Impact on users (blocking access, no heating/cooling = HIGH)
- Urgency signals in text (emergency, immediately, dangerous, broken)
- Scope of impact (affects many people vs one person)
- Category relevance

You MUST respond using the provided tool.`,
          },
          {
            role: "user",
            content: `Title: ${request.title}\nDescription: ${request.description || "No description"}\nCategory: ${request.category}\nLocation: ${request.location || "Not specified"}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "set_priority",
              description: "Set the priority level and urgency score for a maintenance request",
              parameters: {
                type: "object",
                properties: {
                  priority: {
                    type: "string",
                    enum: ["low", "medium", "high", "urgent"],
                    description: "The priority level",
                  },
                  ai_score: {
                    type: "integer",
                    description: "Urgency score from 0-100. 0-25=low, 26-50=medium, 51-75=high, 76-100=urgent",
                  },
                  reasoning: {
                    type: "string",
                    description: "Brief explanation for the priority assignment",
                  },
                },
                required: ["priority", "ai_score", "reasoning"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "set_priority" } },
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI gateway error:", aiResponse.status, await aiResponse.text());
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI did not return priority" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);
    const clampedScore = Math.max(0, Math.min(100, result.ai_score));

    // Update the request with AI results
    const { error: updateError } = await supabase
      .from("maintenance_requests")
      .update({
        priority: result.priority,
        ai_score: clampedScore,
      })
      .eq("id", request_id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update request" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create notification for the user
    await supabase.from("notifications").insert({
      user_id: request.user_id,
      message: `Your request "${request.title}" has been analyzed by AI: Priority set to ${result.priority.toUpperCase()} (score: ${clampedScore}/100).`,
    });

    return new Response(
      JSON.stringify({
        priority: result.priority,
        ai_score: clampedScore,
        reasoning: result.reasoning,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-prioritize error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
