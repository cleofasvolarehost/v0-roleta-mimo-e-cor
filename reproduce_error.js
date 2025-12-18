const { createClient } = require('@supabase/supabase-js');

const url = 'https://gafzjvhtloazpcqnvvkz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZnpqdmh0bG9henBjcW52dmt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDE5NzgsImV4cCI6MjA4MTQ3Nzk3OH0.-gBm-3Wro9xvXS9IhLgoEqlZ8nuKwaJ7Co_FuB1qZ1Y';

const supabase = createClient(url, key);

async function reproduce() {
    console.log("Tentando inserir campanha para testar o erro...");
    
    // Tenta inserir
    const { data, error } = await supabase
        .from('campaigns')
        .insert({ 
            name: 'Teste de Verificação', 
            tenant_id: 'default',
            is_active: false
        })
        .select()
        .single();

    if (error) {
        console.log("❌ ERRO REPRODUZIDO:");
        console.log(JSON.stringify(error, null, 2));
    } else {
        console.log("✅ SUCESSO: Campanha inserida.");
        console.log(data);
        
        // Limpa a sujeira
        await supabase.from('campaigns').delete().eq('id', data.id);
    }
}

reproduce();
