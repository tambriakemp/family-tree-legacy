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

  console.log("[family-trees-list] Request received");

  try {
    // Get and validate auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("[family-trees-list] Missing or invalid Authorization header");
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
      console.log("[family-trees-list] Token validation failed:", claimsError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claims.claims.sub;
    console.log("[family-trees-list] Authenticated user:", userId);

    // Create service client to bypass RLS
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get trees where user is owner
    const { data: ownedTrees, error: ownedError } = await serviceClient
      .from("family_trees")
      .select("*")
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: false });

    if (ownedError) {
      console.error("[family-trees-list] Error fetching owned trees:", ownedError.message);
      return new Response(
        JSON.stringify({ error: ownedError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get trees where user is accepted collaborator
    const { data: collaborations, error: collabError } = await serviceClient
      .from("tree_collaborators")
      .select("family_tree_id")
      .eq("user_id", userId)
      .eq("invite_status", "accepted");

    if (collabError) {
      console.error("[family-trees-list] Error fetching collaborations:", collabError.message);
      return new Response(
        JSON.stringify({ error: collabError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch collaborated trees
    const collaboratedTreeIds = collaborations?.map((c) => c.family_tree_id) || [];
    let collaboratedTrees: any[] = [];

    if (collaboratedTreeIds.length > 0) {
      const { data: collabTrees, error: collabTreesError } = await serviceClient
        .from("family_trees")
        .select("*")
        .in("id", collaboratedTreeIds)
        .order("created_at", { ascending: false });

      if (collabTreesError) {
        console.error("[family-trees-list] Error fetching collaborated trees:", collabTreesError.message);
        return new Response(
          JSON.stringify({ error: collabTreesError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      collaboratedTrees = collabTrees || [];
    }

    // Merge and dedupe (in case user is owner and collaborator on same tree)
    const allTrees = [...(ownedTrees || [])];
    const ownedIds = new Set(ownedTrees?.map((t) => t.id) || []);
    
    for (const tree of collaboratedTrees) {
      if (!ownedIds.has(tree.id)) {
        allTrees.push(tree);
      }
    }

    // Sort by created_at descending
    allTrees.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log("[family-trees-list] Returning", allTrees.length, "trees");

    return new Response(
      JSON.stringify({ data: allTrees }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[family-trees-list] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
