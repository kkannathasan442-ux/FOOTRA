import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { FooterTemplate, Project, ImageJob } from './types';

interface BulkFooterDB extends DBSchema {
  templates: {
    key: string;
    value: FooterTemplate;
  };
  projects: {
    key: string;
    value: Project;
  };
  jobs: {
    key: string;
    value: ImageJob;
    indexes: { 'by-project': string };
  };
}

let dbPromise: Promise<IDBPDatabase<BulkFooterDB>>;

export function initDB() {
  if (!dbPromise && typeof window !== 'undefined') {
    dbPromise = openDB<BulkFooterDB>('bulk-footer-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('templates')) {
          db.createObjectStore('templates', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('jobs')) {
          const jobStore = db.createObjectStore('jobs', { keyPath: 'id' });
          jobStore.createIndex('by-project', 'projectId');
        }
      },
    });
  }
  return dbPromise;
}

// Templates
export async function getTemplates(): Promise<FooterTemplate[]> {
  const db = await initDB();
  if (!db) return [];
  return db.getAll('templates');
}

export async function getTemplate(id: string): Promise<FooterTemplate | undefined> {
  const db = await initDB();
  if (!db) return undefined;
  return db.get('templates', id);
}

export async function saveTemplate(template: FooterTemplate) {
  const db = await initDB();
  if (!db) return;
  return db.put('templates', template);
}

export async function deleteTemplate(id: string) {
  const db = await initDB();
  if (!db) return;
  return db.delete('templates', id);
}

// Projects
export async function getProjects(): Promise<Project[]> {
  const db = await initDB();
  if (!db) return [];
  return db.getAll('projects');
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await initDB();
  if (!db) return undefined;
  return db.get('projects', id);
}

export async function saveProject(project: Project) {
  const db = await initDB();
  if (!db) return;
  return db.put('projects', project);
}

// Jobs
export async function getJobsForProject(projectId: string): Promise<ImageJob[]> {
  const db = await initDB();
  if (!db) return [];
  return db.getAllFromIndex('jobs', 'by-project', projectId);
}

export async function saveJob(job: ImageJob) {
  const db = await initDB();
  if (!db) return;
  return db.put('jobs', job);
}

export async function deleteJobsForProject(projectId: string) {
  const db = await initDB();
  if (!db) return;
  const tx = db.transaction('jobs', 'readwrite');
  const index = tx.store.index('by-project');
  let cursor = await index.openCursor(IDBKeyRange.only(projectId));
  
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}
