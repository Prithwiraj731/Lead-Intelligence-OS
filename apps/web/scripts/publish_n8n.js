const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/.pnpm/@n8n+n8n-nodes-langchain@file+packages+@n8n+nodes-langchain_8f45d63d0fa6ef9edf1be47ccc1eb0ee/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.get('SELECT * FROM workflow_entity WHERE id = ?', ['lio_02_lead_research'], (err, wf) => {
  if (err) {
    console.error('get error:', err);
    process.exit(1);
  }
  console.log('Workflow loaded:', wf.id, wf.versionId);

  // Set active = 1 AND activeVersionId = versionId
  db.run('UPDATE workflow_entity SET active = 1, activeVersionId = ? WHERE id = ?', [wf.versionId, wf.id], (errActive) => {
    if (errActive) console.error('active err:', errActive);
    else console.log('workflow_entity set to active = 1, activeVersionId =', wf.versionId);

    const insertHistory = 'INSERT OR REPLACE INTO workflow_history (versionId, workflowId, authors, nodes, connections, name, autosaved, nodeGroups) VALUES (?, ?, ?, ?, ?, ?, 0, \'[]\')';
    db.run(insertHistory, [wf.versionId, wf.id, 'Prithwiraj Mazumdar', wf.nodes, wf.connections, wf.name], (err2) => {
      if (err2) console.error('history err:', err2);
      else console.log('workflow_history inserted successfully');

      const insertPub = 'INSERT OR REPLACE INTO workflow_published_version (workflowId, publishedVersionId) VALUES (?, ?)';
      db.run(insertPub, [wf.id, wf.versionId], (err3) => {
        if (err3) console.error('pub err:', err3);
        else console.log('workflow_published_version inserted successfully');

        const insertWebhook = 'INSERT OR REPLACE INTO webhook_entity (workflowId, webhookPath, method, node, webhookId) VALUES (?, ?, ?, ?, ?)';
        db.run(insertWebhook, [wf.id, 'lead-research', 'POST', 'Webhook: Inbound Lead Trigger', 'lead-research-trigger'], (err4) => {
          if (err4) console.error('webhook err:', err4);
          else console.log('webhook_entity registered successfully');
        });
      });
    });
  });
});
