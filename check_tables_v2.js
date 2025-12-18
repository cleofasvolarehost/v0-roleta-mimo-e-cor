const { createClient } = require('@supabase/supabase-js');

const url = 'https://gafzjvhtloazpcqnvvkz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZnpqdmh0bG9henBjcW52dmt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDE5NzgsImV4cCI6MjA4MTQ3Nzk3OH0.-gBm-3Wro9xvXS9IhLgoEqlZ8nuKwaJ7Co_FuB1qZ1Y';

const supabase = createClient(url, key);

async function checkTable(tableName) {
    console.log(`Verificando ${tableName}...`);
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    
    if (error) {
        console.log(`❌ ${tableName}: ${JSON.stringify(error)}`);
    } else {
        console.log(`✅ ${tableName}: Acesso OK. Registros: ${data.length}`);
    }
}

async function run() {
    await checkTable('campaigns');
    await checkTable('players');
}

run();
