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

  console.log("[family-trees-get] Request received");

  try {
    // Get and validate auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("[family-trees-get] Missing or invalid Authorization header");
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
      console.log("[family-trees-get] Token validation failed:", claimsError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claims.claims.sub;
    console.log("[family-trees-get] Authenticated user:", userId);

    // Parse request body to get tree id
    const body = await req.json();
    const treeId = body.treeId;

    if (!treeId) {
      console.log("[family-trees-get] Missing treeId");
      return new Response(
        JSON.stringify({ error: "Tree ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service client to bypass RLS
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the tree
    const { data: tree, error: fetchError } = await serviceClient
      .from("family_trees")
      .select("*")
      .eq("id", treeId)
      .single();

    if (fetchError) {
      console.error("[family-trees-get] Error fetching tree:", fetchError.message);
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

    // Check access: user must be owner or accepted collaborator
    const isOwner = tree.owner_user_id === userId;

    if (!isOwner) {
      // Check if user is accepted collaborator
      const { data: collab, error: collabError } = await serviceClient
        .from("tree_collaborators")
        .select("id")
        .eq("family_tree_id", treeId)
        .eq("user_id", userId)
        .eq("invite_status", "accepted")
        .single();

      if (collabError || !collab) {
        console.log("[family-trees-get] Access denied for user:", userId);
        return new Response(
          JSON.stringify({ error: "Access denied" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log("[family-trees-get] Returning tree:", tree.id);

    return new Response(
      JSON.stringify({ data: tree }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[family-trees-get] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
