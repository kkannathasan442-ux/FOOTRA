import { supabase } from './supabase';
import { FooterTemplate, Project, ImageJob } from './types';

// --- Mappers ---

function mapTemplateFromDB(row: any): FooterTemplate {
  return {
    id: row.id,
    name: row.name,
    imageUrl: row.image_url,
    width: row.width,
    height: row.height,
    aspectRatio: row.aspect_ratio,
    defaultHeightMode: row.default_height_mode,
    defaultHeightValue: row.default_height_value,
    position: row.position,
    opacity: row.opacity,
    safeArea: row.safe_area,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTemplateToDB(template: FooterTemplate): any {
  return {
    id: template.id,
    name: template.name,
    image_url: template.imageUrl,
    width: template.width,
    height: template.height,
    aspect_ratio: template.aspectRatio,
    default_height_mode: template.defaultHeightMode,
    default_height_value: template.defaultHeightValue,
    position: template.position,
    opacity: template.opacity,
    safe_area: template.safeArea,
    created_at: template.createdAt,
    updated_at: template.updatedAt,
  };
}

function mapProjectFromDB(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    templateId: row.template_id,
    status: row.status,
    imageCount: row.image_count,
    completedCount: row.completed_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProjectToDB(project: Project): any {
  return {
    id: project.id,
    name: project.name,
    template_id: project.templateId,
    status: project.status,
    image_count: project.imageCount,
    completed_count: project.completedCount,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
  };
}

function mapJobFromDB(row: any): ImageJob {
  return {
    id: row.id,
    projectId: row.project_id,
    originalName: row.original_name,
    width: row.width,
    height: row.height,
    fileSize: row.file_size,
    status: row.status,
    outputUrl: row.output_url,
    error: row.error,
    override: row.override,
  };
}

function mapJobToDB(job: ImageJob): any {
  return {
    id: job.id,
    project_id: job.projectId,
    original_name: job.originalName,
    width: job.width,
    height: job.height,
    file_size: job.fileSize,
    status: job.status,
    output_url: job.outputUrl,
    error: job.error,
    override: job.override,
  };
}

// --- Templates ---
export async function getTemplates(): Promise<FooterTemplate[]> {
  const { data, error } = await supabase.from('templates').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
  return data ? data.map(mapTemplateFromDB) : [];
}

export async function getTemplate(id: string): Promise<FooterTemplate | undefined> {
  const { data, error } = await supabase.from('templates').select('*').eq('id', id).single();
  if (error) {
    console.error('Error fetching template:', error);
    return undefined;
  }
  return data ? mapTemplateFromDB(data) : undefined;
}

export async function saveTemplate(template: FooterTemplate) {
  const { error } = await supabase.from('templates').upsert(mapTemplateToDB(template));
  if (error) console.error('Error saving template:', JSON.stringify(error, null, 2));
}

export async function deleteTemplate(id: string) {
  const { error } = await supabase.from('templates').delete().eq('id', id);
  if (error) console.error('Error deleting template:', error);
}

// --- Projects ---
export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
  return data ? data.map(mapProjectFromDB) : [];
}

export async function getProject(id: string): Promise<Project | undefined> {
  const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
  if (error) {
    console.error('Error fetching project:', error);
    return undefined;
  }
  return data ? mapProjectFromDB(data) : undefined;
}

export async function saveProject(project: Project) {
  const { error } = await supabase.from('projects').upsert(mapProjectToDB(project));
  if (error) console.error('Error saving project:', error);
}

// --- Jobs ---
export async function getJobsForProject(projectId: string): Promise<ImageJob[]> {
  const { data, error } = await supabase.from('jobs').select('*').eq('project_id', projectId);
  if (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }
  return data ? data.map(mapJobFromDB) : [];
}

export async function saveJob(job: ImageJob) {
  const { error } = await supabase.from('jobs').upsert(mapJobToDB(job));
  if (error) console.error('Error saving job:', error);
}

export async function deleteJobsForProject(projectId: string) {
  const { error } = await supabase.from('jobs').delete().eq('project_id', projectId);
  if (error) console.error('Error deleting jobs:', error);
}
