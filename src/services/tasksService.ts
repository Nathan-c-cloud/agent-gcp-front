/**
 * Service pour gérer les tâches
 */

import { ENDPOINTS } from '../config/api';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string;
  created_at: number;
  updated_at: number;
  created_by: string;
  org_id: string;
  rule_id?: string;
  needs_review: boolean;
}

class TasksService {
  /**
   * Récupère toutes les tâches d'une organisation
   */
  async getTasksByOrg(orgId: string): Promise<Task[]> {
    try {
      console.log(`📋 Fetching tasks for org: ${orgId}`);
      const response = await fetch(ENDPOINTS.tasks.byOrg(orgId));
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Fetched ${data.tasks?.length || 0} tasks`);
      return data.tasks || [];
    } catch (error) {
      console.error('❌ Error fetching tasks:', error);
      throw error;
    }
  }

  /**
   * Récupère une tâche par son ID
   */
  async getTaskById(taskId: string): Promise<Task> {
    try {
      console.log(`📋 Fetching task: ${taskId}`);
      const response = await fetch(ENDPOINTS.tasks.byId(taskId));
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Fetched task:`, data.task);
      return data.task;
    } catch (error) {
      console.error('❌ Error fetching task:', error);
      throw error;
    }
  }

  /**
   * Met à jour le statut d'une tâche
   */
  async updateTaskStatus(taskId: string, status: Task['status']): Promise<Task> {
    try {
      console.log(`📝 Updating task ${taskId} status to: ${status}`);
      const response = await fetch(ENDPOINTS.tasks.updateStatus(taskId), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Task status updated:`, data.task);
      return data.task;
    } catch (error) {
      console.error('❌ Error updating task status:', error);
      throw error;
    }
  }

  /**
   * Health check du service des tâches
   */
  async healthCheck(): Promise<{ status: string }> {
    try {
      const response = await fetch(ENDPOINTS.tasks.health);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('❌ Tasks service health check failed:', error);
      throw error;
    }
  }
}

export const tasksService = new TasksService();
