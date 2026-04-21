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
            content: `You are a university campus maintenance request priority analyzer for Jackson State University (JSU). Analyze each maintenance request and determine its priority and urgency score based on realistic campus impact.

PRIORITY GUIDELINES (be strict and accurate):

URGENT (score 76-100) — Immediate danger or critical infrastructure failure:
- Gas leaks, fire hazards, exposed electrical wiring, flooding
- Elevator stuck with people inside
- Complete loss of heating/cooling in extreme weather
- Sewage backup, major water main break
- Structural collapse risk, ceiling falling
- Security system failure (locks broken on exterior doors)

HIGH (score 51-75) — Significant impact on daily operations or safety concern:
- Water leak causing damage (not just a drip)
- No hot water in an entire dorm building
- Broken windows exposing rooms to weather
- HVAC failure affecting multiple rooms
- Pest infestation (rats, roaches in large numbers)
- Broken stairwell lighting, emergency exit blocked
- Mold growth in living/working spaces

MEDIUM (score 26-50) — Notable inconvenience but not immediately dangerous:
- Single toilet/sink not working (others available)
- Minor water drip or slow drain
- One room's AC/heater not working (not extreme weather)
- Flickering lights (not complete darkness)
- Damaged furniture needing replacement
- Minor wall/floor damage
- Appliance malfunction (washer, dryer)

LOW (score 0-25) — Cosmetic or minor convenience issues:
- Paint chipping, scuff marks on walls
- Squeaky doors, loose door handles
- Light bulb replacement
- Minor cleaning requests
- Cosmetic damage that doesn't affect function
- Request for additional amenities

IMPORTANT RULES:
- Consider how many people are affected (whole building vs one room)
- Consider time sensitivity (weekend vs weekday, weather conditions)
- Use the FULL range of scores, not just round numbers
- A "broken toilet" in a shared bathroom is HIGH; in a room with another bathroom is MEDIUM
- "Emergency" or "urgent" in the title alone does NOT make it urgent — evaluate the actual issue
- Be precise: a clogged drain is MEDIUM, a sewage backup is URGENT

You MUST respond using the provided tool.`,
          },
          {
            role: "user",
            content: `Title: ${request.title}\nDescription: ${request.description || "No description provided"}\nCategory: ${request.category}\nLocation: ${request.location || "Not specified"}`,
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
                    description: "The priority level based on safety, scope, and urgency",
                  },
                  ai_score: {
                    type: "integer",
                    description: "Urgency score from 0-100. Must align with priority: 0-25=low, 26-50=medium, 51-75=high, 76-100=urgent",
                  },
                  reasoning: {
                    type: "string",
                    description: "2-3 sentence explanation of why this priority was assigned, referencing specific factors",
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
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI did not return priority" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);
    const clampedScore = Math.max(0, Math.min(100, result.ai_score));

    const { error: updateError } = await supabase
      .from("maintenance_requests")
      .update({ priority: result.priority, ai_score: clampedScore })
      .eq("id", request_id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update request" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("notifications").insert({
      user_id: request.user_id,
      message: `Your request "${request.title}" has been analyzed: Priority set to ${result.priority.toUpperCase()} (score: ${clampedScore}/100). ${result.reasoning}`,
    });

    return new Response(
      JSON.stringify({ priority: result.priority, ai_score: clampedScore, reasoning: result.reasoning }),
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
