import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  inviteId: string;
  email: string;
  treeId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inviteId, email, treeId }: InviteRequest = await req.json();
    
    console.log(`Processing invite request: inviteId=${inviteId}, email=${email}, treeId=${treeId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get tree details
    const { data: tree, error: treeError } = await supabase
      .from("family_trees")
      .select("title, owner_user_id")
      .eq("id", treeId)
      .single();

    if (treeError) {
      console.error("Error fetching tree:", treeError);
      throw new Error("Failed to fetch tree details");
    }

    // Get inviter profile
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", tree.owner_user_id)
      .single();

    const inviterName = inviterProfile?.full_name || "A family member";
    const treeName = tree.title || "a family tree";

    // Build the invite URL
    const appUrl = Deno.env.get("APP_URL") || "https://id-preview--add24ff3-2cd3-4cda-a42f-8e00ba4c941a.lovable.app";
    const inviteUrl = `${appUrl}/dashboard?invite=${inviteId}`;

    // Check if Resend API key is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured - skipping email send");
      console.log(`Invite URL for manual sharing: ${inviteUrl}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Invite created but email not sent (RESEND_API_KEY not configured)",
          inviteUrl,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send email using Resend
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: bold; color: #5B8C5A; }
            .content { background: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 30px; }
            .button { display: inline-block; background: #5B8C5A; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; }
            .button:hover { background: #4a7a49; }
            .footer { text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🌳 FamilyFlow</div>
            </div>
            <div class="content">
              <h2>You're Invited!</h2>
              <p><strong>${inviterName}</strong> has invited you to collaborate on <strong>"${treeName}"</strong> in FamilyFlow.</p>
              <p>FamilyFlow is a beautiful way to build and share your family tree, preserve memories, and stay connected with loved ones.</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" class="button">Accept Invitation</a>
              </p>
              <p style="font-size: 14px; color: #666;">
                If you don't have an account yet, you'll be prompted to create one. Once signed up, you'll automatically have access to the family tree.
              </p>
            </div>
            <div class="footer">
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              <p>© FamilyFlow - Connecting Families, Preserving Memories</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("EMAIL_FROM") || "FamilyFlow <onboarding@resend.dev>",
        to: [email],
        subject: `${inviterName} invited you to collaborate on "${treeName}"`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
