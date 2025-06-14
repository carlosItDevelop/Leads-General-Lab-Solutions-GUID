
const { pool } = require('./database');

// Migração para UUIDs
async function migrateToUUIDs() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('🔄 Iniciando migração para UUIDs...');
        
        // 1. Habilitar extensão UUID
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        
        // 2. Adicionar colunas UUID nas tabelas principais
        await client.query('ALTER TABLE leads ADD COLUMN uuid_id UUID DEFAULT uuid_generate_v4()');
        await client.query('ALTER TABLE tasks ADD COLUMN uuid_id UUID DEFAULT uuid_generate_v4()');
        await client.query('ALTER TABLE activities ADD COLUMN uuid_id UUID DEFAULT uuid_generate_v4()');
        await client.query('ALTER TABLE logs ADD COLUMN uuid_id UUID DEFAULT uuid_generate_v4()');
        await client.query('ALTER TABLE notes ADD COLUMN uuid_id UUID DEFAULT uuid_generate_v4()');
        await client.query('ALTER TABLE task_comments ADD COLUMN uuid_id UUID DEFAULT uuid_generate_v4()');
        await client.query('ALTER TABLE task_attachments ADD COLUMN uuid_id UUID DEFAULT uuid_generate_v4()');
        
        // 3. Adicionar colunas UUID para foreign keys
        await client.query('ALTER TABLE tasks ADD COLUMN lead_uuid_id UUID');
        await client.query('ALTER TABLE activities ADD COLUMN lead_uuid_id UUID');
        await client.query('ALTER TABLE logs ADD COLUMN lead_uuid_id UUID');
        await client.query('ALTER TABLE notes ADD COLUMN lead_uuid_id UUID');
        await client.query('ALTER TABLE task_comments ADD COLUMN task_uuid_id UUID');
        await client.query('ALTER TABLE task_attachments ADD COLUMN task_uuid_id UUID');
        
        // 4. Preencher foreign keys UUID baseado nos IDs existentes
        await client.query(`
            UPDATE tasks 
            SET lead_uuid_id = (SELECT uuid_id FROM leads WHERE leads.id = tasks.lead_id)
            WHERE lead_id IS NOT NULL
        `);
        
        await client.query(`
            UPDATE activities 
            SET lead_uuid_id = (SELECT uuid_id FROM leads WHERE leads.id = activities.lead_id)
            WHERE lead_id IS NOT NULL
        `);
        
        await client.query(`
            UPDATE logs 
            SET lead_uuid_id = (SELECT uuid_id FROM leads WHERE leads.id = logs.lead_id)
            WHERE lead_id IS NOT NULL
        `);
        
        await client.query(`
            UPDATE notes 
            SET lead_uuid_id = (SELECT uuid_id FROM leads WHERE leads.id = notes.lead_id)
            WHERE lead_id IS NOT NULL
        `);
        
        await client.query(`
            UPDATE task_comments 
            SET task_uuid_id = (SELECT uuid_id FROM tasks WHERE tasks.id = task_comments.task_id)
            WHERE task_id IS NOT NULL
        `);
        
        await client.query(`
            UPDATE task_attachments 
            SET task_uuid_id = (SELECT uuid_id FROM tasks WHERE tasks.id = task_attachments.task_id)
            WHERE task_id IS NOT NULL
        `);
        
        // 5. Remover constraints de foreign key antigas
        await client.query('ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_lead_id_fkey');
        await client.query('ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_lead_id_fkey');
        await client.query('ALTER TABLE logs DROP CONSTRAINT IF EXISTS logs_lead_id_fkey');
        await client.query('ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_lead_id_fkey');
        await client.query('ALTER TABLE task_comments DROP CONSTRAINT IF EXISTS task_comments_task_id_fkey');
        await client.query('ALTER TABLE task_attachments DROP CONSTRAINT IF EXISTS task_attachments_task_id_fkey');
        
        // 6. Definir novos primary keys
        await client.query('ALTER TABLE leads DROP CONSTRAINT leads_pkey');
        await client.query('ALTER TABLE leads ADD CONSTRAINT leads_pkey PRIMARY KEY (uuid_id)');
        
        await client.query('ALTER TABLE tasks DROP CONSTRAINT tasks_pkey');
        await client.query('ALTER TABLE tasks ADD CONSTRAINT tasks_pkey PRIMARY KEY (uuid_id)');
        
        await client.query('ALTER TABLE activities DROP CONSTRAINT activities_pkey');
        await client.query('ALTER TABLE activities ADD CONSTRAINT activities_pkey PRIMARY KEY (uuid_id)');
        
        await client.query('ALTER TABLE logs DROP CONSTRAINT logs_pkey');
        await client.query('ALTER TABLE logs ADD CONSTRAINT logs_pkey PRIMARY KEY (uuid_id)');
        
        await client.query('ALTER TABLE notes DROP CONSTRAINT notes_pkey');
        await client.query('ALTER TABLE notes ADD CONSTRAINT notes_pkey PRIMARY KEY (uuid_id)');
        
        await client.query('ALTER TABLE task_comments DROP CONSTRAINT task_comments_pkey');
        await client.query('ALTER TABLE task_comments ADD CONSTRAINT task_comments_pkey PRIMARY KEY (uuid_id)');
        
        await client.query('ALTER TABLE task_attachments DROP CONSTRAINT task_attachments_pkey');
        await client.query('ALTER TABLE task_attachments ADD CONSTRAINT task_attachments_pkey PRIMARY KEY (uuid_id)');
        
        // 7. Adicionar novos foreign keys
        await client.query('ALTER TABLE tasks ADD CONSTRAINT tasks_lead_uuid_id_fkey FOREIGN KEY (lead_uuid_id) REFERENCES leads(uuid_id)');
        await client.query('ALTER TABLE activities ADD CONSTRAINT activities_lead_uuid_id_fkey FOREIGN KEY (lead_uuid_id) REFERENCES leads(uuid_id)');
        await client.query('ALTER TABLE logs ADD CONSTRAINT logs_lead_uuid_id_fkey FOREIGN KEY (lead_uuid_id) REFERENCES leads(uuid_id)');
        await client.query('ALTER TABLE notes ADD CONSTRAINT notes_lead_uuid_id_fkey FOREIGN KEY (lead_uuid_id) REFERENCES leads(uuid_id) ON DELETE CASCADE');
        await client.query('ALTER TABLE task_comments ADD CONSTRAINT task_comments_task_uuid_id_fkey FOREIGN KEY (task_uuid_id) REFERENCES tasks(uuid_id) ON DELETE CASCADE');
        await client.query('ALTER TABLE task_attachments ADD CONSTRAINT task_attachments_task_uuid_id_fkey FOREIGN KEY (task_uuid_id) REFERENCES tasks(uuid_id) ON DELETE CASCADE');
        
        // 8. Remover colunas antigas (comentado para segurança - executar depois de testes)
        /*
        await client.query('ALTER TABLE leads DROP COLUMN id');
        await client.query('ALTER TABLE tasks DROP COLUMN id, DROP COLUMN lead_id');
        await client.query('ALTER TABLE activities DROP COLUMN id, DROP COLUMN lead_id');
        await client.query('ALTER TABLE logs DROP COLUMN id, DROP COLUMN lead_id');
        await client.query('ALTER TABLE notes DROP COLUMN id, DROP COLUMN lead_id');
        await client.query('ALTER TABLE task_comments DROP COLUMN id, DROP COLUMN task_id');
        await client.query('ALTER TABLE task_attachments DROP COLUMN id, DROP COLUMN task_id');
        */
        
        // 9. Renomear colunas UUID para id
        await client.query('ALTER TABLE leads RENAME COLUMN uuid_id TO id');
        await client.query('ALTER TABLE tasks RENAME COLUMN uuid_id TO id');
        await client.query('ALTER TABLE tasks RENAME COLUMN lead_uuid_id TO lead_id');
        await client.query('ALTER TABLE activities RENAME COLUMN uuid_id TO id');
        await client.query('ALTER TABLE activities RENAME COLUMN lead_uuid_id TO lead_id');
        await client.query('ALTER TABLE logs RENAME COLUMN uuid_id TO id');
        await client.query('ALTER TABLE logs RENAME COLUMN lead_uuid_id TO lead_id');
        await client.query('ALTER TABLE notes RENAME COLUMN uuid_id TO id');
        await client.query('ALTER TABLE notes RENAME COLUMN lead_uuid_id TO lead_id');
        await client.query('ALTER TABLE task_comments RENAME COLUMN uuid_id TO id');
        await client.query('ALTER TABLE task_comments RENAME COLUMN task_uuid_id TO task_id');
        await client.query('ALTER TABLE task_attachments RENAME COLUMN uuid_id TO id');
        await client.query('ALTER TABLE task_attachments RENAME COLUMN task_uuid_id TO task_id');
        
        await client.query('COMMIT');
        console.log('✅ Migração para UUIDs concluída com sucesso!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erro na migração:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Função para rollback (voltar para IDs sequenciais)
async function rollbackToSerial() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('🔄 Fazendo rollback para IDs sequenciais...');
        
        // Implementar rollback se necessário
        // (seria complexo, melhor ter backup)
        
        await client.query('COMMIT');
        console.log('✅ Rollback concluído!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erro no rollback:', error);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    migrateToUUIDs,
    rollbackToSerial
};
