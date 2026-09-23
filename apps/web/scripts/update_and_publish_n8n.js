const fs = require('fs');
const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/.pnpm/@n8n+n8n-nodes-langchain@file+packages+@n8n+nodes-langchain_8f45d63d0fa6ef9edf1be47ccc1eb0ee/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

const rawWorkflow = fs.readFileSync('/tmp/Lead_Research_Workflow.json', 'utf8');
const wfJson = JSON.parse(rawWorkflow);

const newVersionId = 'v2_' + Date.now().toString(36);
const nodesStr = JSON.stringify(wfJson.nodes);
const connectionsStr = JSON.stringify(wfJson.connections);
const settingsStr = JSON.stringify(wfJson.settings || { executionOrder: 'v1' });

console.log('Updating workflow:', wfJson.id, 'with newVersionId:', newVersionId);

db.run(
  `UPDATE workflow_entity SET 
    nodes = ?, 
    connections = ?, 
    settings = ?, 
    active = 1, 
    versionId = ?, 
    activeVersionId = ?,
    updatedAt = datetime('now')
  WHERE id = ?`,
  [nodesStr, connectionsStr, settingsStr, newVersionId, newVersionId, wfJson.id],
  function (err) {
    if (err) {
      console.error('Update workflow_entity failed:', err);
      process.exit(1);
    }
    console.log('workflow_entity updated successfully. Rows modified:', this.changes);

    const insertHistory = `INSERT OR REPLACE INTO workflow_history 
      (versionId, workflowId, authors, nodes, connections, name, autosaved, nodeGroups) 
      VALUES (?, ?, ?, ?, ?, ?, 0, '[]')`;

    db.run(insertHistory, [newVersionId, wfJson.id, 'Prithwiraj Mazumdar', nodesStr, connectionsStr, wfJson.name], (err2) => {
      if (err2) console.error('Insert history failed:', err2);
      else console.log('workflow_history inserted successfully.');

      const insertPub = `INSERT OR REPLACE INTO workflow_published_version 
        (workflowId, publishedVersionId) 
        VALUES (?, ?)`;

      db.run(insertPub, [wfJson.id, newVersionId], (err3) => {
        if (err3) console.error('Insert published version failed:', err3);
        else console.log('workflow_published_version updated to:', newVersionId);

        const insertWebhook = `INSERT OR REPLACE INTO webhook_entity 
          (workflowId, webhookPath, method, node, webhookId) 
          VALUES (?, ?, ?, ?, ?)`;

        db.run(insertWebhook, [wfJson.id, 'lead-research', 'POST', 'Webhook: Inbound Lead Trigger', 'lead-research-trigger'], (err4) => {
          if (err4) console.error('Insert webhook failed:', err4);
          else console.log('webhook_entity updated successfully.');
          
          db.close();
        });
      });
    });
  }
);
