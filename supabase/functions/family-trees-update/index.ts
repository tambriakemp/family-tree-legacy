import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateTreeRequest {
  id: string;
  title?: string;
  description?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[family-trees-update] Request received");

  try {
    // Get and validate auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("[family-trees-update] Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth client to validate user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validate the token
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await authClient.auth.getClaims(token);

    if (claimsError || !claims?.claims) {
      console.log("[family-trees-update] Token validation failed:", claimsError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claims.claims.sub;
    console.log("[family-trees-update] Authenticated user:", userId);

    // Parse request body
    const body: UpdateTreeRequest = await req.json();

    if (!body.id) {
      console.log("[family-trees-update] Missing tree id");
      return new Response(
        JSON.stringify({ error: "Tree ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service client to bypass RLS
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch tree to verify ownership
    const { data: tree, error: fetchError } = await serviceClient
      .from("family_trees")
      .select("owner_user_id")
      .eq("id", body.id)
      .single();

    if (fetchError) {
      console.error("[family-trees-update] Error fetching tree:", fetchError.message);
      if (fetchError.code === "PGRST116") {
        return new Response(
          JSON.stringify({ error: "Tree not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only owner can update
    if (tree.owner_user_id !== userId) {
      console.log("[family-trees-update] Access denied - not owner:", userId);
      return new Response(
        JSON.stringify({ error: "Only the owner can update this tree" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build update object with only allowed fields
    const updateData: Record<string, any> = {};
    if (body.title !== undefined) {
      updateData.title = body.title.trim();
    }
    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }

    if (Object.keys(updateData).length === 0) {
      console.log("[family-trees-update] No fields to update");
      return new Response(
        JSON.stringify({ error: "No fields to update" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Perform update
    const { data: updated, error: updateError } = await serviceClient
      .from("family_trees")
      .update(updateData)
      .eq("id", body.id)
      .select()
      .single();

    if (updateError) {
      console.error("[family-trees-update] Update failed:", updateError.message);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[family-trees-update] Tree updated successfully:", body.id);

    return new Response(
      JSON.stringify({ data: updated }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[family-trees-update] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
