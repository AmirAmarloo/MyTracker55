export interface Project {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
}


export interface ActivationResponse {
  clientName: string;
  tenantSchema: string;
  authToken: string;
  projects: Project[];
}