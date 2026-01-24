import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[family-trees-delete] Request received");

  try {
    // Get and validate auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("[family-trees-delete] Missing or invalid Authorization header");
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
      console.log("[family-trees-delete] Token validation failed:", claimsError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claims.claims.sub;
    console.log("[family-trees-delete] Authenticated user:", userId);

    // Parse request body to get tree id
    const body = await req.json();
    const treeId = body.id;

    if (!treeId) {
      console.log("[family-trees-delete] Missing tree id");
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
      .eq("id", treeId)
      .single();

    if (fetchError) {
      console.error("[family-trees-delete] Error fetching tree:", fetchError.message);
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

    // Only owner can delete
    if (tree.owner_user_id !== userId) {
      console.log("[family-trees-delete] Access denied - not owner:", userId);
      return new Response(
        JSON.stringify({ error: "Only the owner can delete this tree" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete the tree (cascading deletes should handle related data)
    const { error: deleteError } = await serviceClient
      .from("family_trees")
      .delete()
      .eq("id", treeId);

    if (deleteError) {
      console.error("[family-trees-delete] Delete failed:", deleteError.message);
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[family-trees-delete] Tree deleted successfully:", treeId);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[family-trees-delete] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
