/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'applicant' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  password?: string;
  phoneNumber?: string;
  authProvider?: 'email' | 'google' | 'phone';
}

export type ApplicationStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Technical Review'
  | 'Approved'
  | 'Rejected';

export interface ReviewHistoryEntry {
  id: string;
  statusFrom: ApplicationStatus | 'None';
  statusTo: ApplicationStatus;
  actionBy: string;
  actionByRole: 'admin';
  comments: string;
  timestamp: string;
}

export interface ApplicationAttachment {
  name: string;
  size: string;
  type: string;
}

export type ApplicationPriority = 'Low' | 'Medium' | 'High';

export interface Application {
  id: string;
  title: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  department: string;
  category: string;
  description: string;
  proposedSolution: string;
  teamSize: number;
  budget: number;
  timeline: string;
  expectedImpact: string;
  submittedAt: string;
  status: ApplicationStatus;
  attachments: ApplicationAttachment[];
  reviewHistory: ReviewHistoryEntry[];
  priority?: ApplicationPriority;
}
