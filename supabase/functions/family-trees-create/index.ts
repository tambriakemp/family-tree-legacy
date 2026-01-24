import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateTreeRequest {
  title: string;
  description?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[family-trees-create] Request received");

  try {
    // Get and validate auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("[family-trees-create] Missing or invalid Authorization header");
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
      console.log("[family-trees-create] Token validation failed:", claimsError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claims.claims.sub;
    console.log("[family-trees-create] Authenticated user:", userId);

    // Parse request body
    const body: CreateTreeRequest = await req.json();
    
    if (!body.title?.trim()) {
      console.log("[family-trees-create] Missing title");
      return new Response(
        JSON.stringify({ error: "Title is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service client to bypass RLS
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Insert tree with validated user id (ignore any client-supplied owner_user_id)
    const { data: tree, error: insertError } = await serviceClient
      .from("family_trees")
      .insert({
        title: body.title.trim(),
        description: body.description?.trim() || null,
        owner_user_id: userId, // Always use validated user id
      })
      .select()
      .single();

    if (insertError) {
      console.error("[family-trees-create] Insert failed:", insertError.message);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[family-trees-create] Tree created successfully:", tree.id);

    return new Response(
      JSON.stringify({ data: tree }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[family-trees-create] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
