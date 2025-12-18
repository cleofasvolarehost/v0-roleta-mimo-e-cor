const { createClient } = require('@supabase/supabase-js');

const url = 'https://gafzjvhtloazpcqnvvkz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZnpqdmh0bG9henBjcW52dmt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDE5NzgsImV4cCI6MjA4MTQ3Nzk3OH0.-gBm-3Wro9xvXS9IhLgoEqlZ8nuKwaJ7Co_FuB1qZ1Y';

const supabase = createClient(url, key);

async function checkTable(tableName) {
    try {
        const { data, error } = await supabase.from(tableName).select('count', { count: 'exact', head: true });
        if (error) {
            console.log(`❌ Tabela '${tableName}': Erro - ${error.message}`);
            return false;
        } else {
            console.log(`✅ Tabela '${tableName}': OK (Existe)`);
            return true;
        }
    } catch (e) {
        console.log(`❌ Tabela '${tableName}': Erro Inesperado - ${e.message}`);
        return false;
    }
}

async function run() {
    console.log("Verificando conexão e tabelas no Supabase...");
    await checkTable('campaigns');
    await checkTable('players');
    await checkTable('prizes');
    await checkTable('spins');
}

run();
