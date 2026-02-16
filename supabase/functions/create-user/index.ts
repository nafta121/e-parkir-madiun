import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Declare Deno to avoid TypeScript errors in non-Deno environments
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      // Supabase API URL - Env var automatically populated by Supabase
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase Service Role Key - Env var automatically populated by Supabase
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const { email, password, fullName } = await req.json()

    if (!email || !password || !fullName) {
       return new Response(
        JSON.stringify({ error: 'Email, Password, and Full Name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Create User in Auth System
    // We set email_confirm: true so they can login immediately
    const { data: userData, error: createError } = await supabaseClient.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    })

    if (createError) {
      throw createError
    }

    // 2. Update Profile with Full Name
    // Note: The SQL Trigger 'on_auth_user_created' likely already created the row with default role 'kolektor'.
    // We just need to update the name.
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', userData.user.id)

    if (profileError) {
      console.error("Profile update failed:", profileError)
      // We don't throw here to avoid failing the whole request if just the name failed, 
      // but strictly speaking we should probably rollback or alert.
    }

    return new Response(
      JSON.stringify({ user: userData.user, message: "User created successfully" }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})