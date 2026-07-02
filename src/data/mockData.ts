/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Application, User } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: 'usr_1',
    email: 'applicant@company.ai',
    name: 'Sarah Jenkins',
    role: 'applicant',
    department: 'Customer Experience Operations',
    password: 'password123',
  },
  {
    id: 'usr_2',
    email: 'innovator@company.ai',
    name: 'Dr. Marcus Vance',
    role: 'applicant',
    department: 'R&D Lab and Engineering',
    password: 'password123',
  },
  {
    id: 'usr_admin',
    email: 'admin@company.ai',
    name: 'Chief AI Reviewer',
    role: 'admin',
    department: 'AI Governance Board',
    password: 'admin123',
  },
];

export const CATEGORIES = [
  'Generative AI & LLMs',
  'Computer Vision & OCR',
  'NLP & Sentiment Analysis',
  'Predictive Analytics & Forecasting',
  'Robotics & Automation',
];

export const TIMELINES = [
  '3 Months (Short Term MVP)',
  '6 Months (Standard Pilot)',
  '12 Months (Strategic Initiative)',
];

export const INITIAL_APPLICATIONS: Application[] = [
  {
    id: 'APP-2026-001',
    title: 'Cognitive CS Agent: Auto-Resolving Tier 1 Tickets',
    applicantId: 'usr_1',
    applicantName: 'Sarah Jenkins',
    applicantEmail: 'applicant@company.ai',
    department: 'Customer Experience Operations',
    category: 'Generative AI & LLMs',
    description: 'We experience high volumes of Tier 1 customer queries related to basic account settings, password resets, and subscription updates. This project aims to integrate a customized LLM assistant directly into our customer support channel to safely auto-resolve up to 45% of these tickets, freeing up human agents for complex matters.',
    proposedSolution: 'Using retrieval-augmented generation (RAG) hooked into our corporate wiki and user settings databases. Guardrails will filter out non-support queries, and an automatic human-handoff flag will trigger if confidence falls below 85% or if frustration patterns are detected.',
    teamSize: 4,
    budget: 45000,
    timeline: '3 Months (Short Term MVP)',
    expectedImpact: 'Reduce support queue waiting times from 12 minutes to 5 seconds. Save an estimated $120,000 annually in support agent overhead and increase customer satisfaction (CSAT) by 18 points.',
    submittedAt: '2026-06-15T09:30:00Z',
    status: 'Approved',
    attachments: [
      { name: 'architecture_diagram.pdf', size: '2.4 MB', type: 'application/pdf' },
      { name: 'roi_estimation_spreadsheet.xlsx', size: '420 KB', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    ],
    reviewHistory: [
      {
        id: 'rev_1',
        statusFrom: 'None',
        statusTo: 'Submitted',
        actionBy: 'Sarah Jenkins',
        actionByRole: 'admin', // mapped appropriately
        comments: 'Initial project submission with complete technical diagram and budget layout.',
        timestamp: '2026-06-15T09:30:00Z',
      },
      {
        id: 'rev_2',
        statusFrom: 'Submitted',
        statusTo: 'Under Review',
        actionBy: 'Elena Rostova (AI Governance)',
        actionByRole: 'admin',
        comments: 'Assigned to Technical Committee for feasibility review. Looks highly viable with clear RAG architecture.',
        timestamp: '2026-06-16T14:15:00Z',
      },
      {
        id: 'rev_3',
        statusFrom: 'Under Review',
        statusTo: 'Approved',
        actionBy: 'AI Governance Board',
        actionByRole: 'admin',
        comments: 'Funding approved. Excellent risk-mitigation strategy (confidence hand-off) and strong projected ROI. Sarah, please coordinate with IT Security before kickoff.',
        timestamp: '2026-06-20T11:00:00Z',
      },
    ],
  },
  {
    id: 'APP-2026-002',
    title: 'Defect Detection via Computer Vision in Assembly Line 4',
    applicantId: 'usr_2',
    applicantName: 'Dr. Marcus Vance',
    applicantEmail: 'innovator@company.ai',
    department: 'R&D Lab and Engineering',
    category: 'Computer Vision & OCR',
    description: 'Manual inspection of physical parts on Assembly Line 4 results in a 4% defect slip rate, causing expensive product returns. We propose setting up high-speed industrial cameras paired with a customized edge convolutional neural network (CNN) to detect micro-cracks in real-time.',
    proposedSolution: 'Installation of three high-definition synchronized focal lenses on Line 4. A lightweight CNN model trained on our proprietary historical defect dataset will perform inference locally at 60fps, raising an instant physical alarm and mechanical gateway diversion if a crack is spotted.',
    teamSize: 5,
    budget: 95000,
    timeline: '6 Months (Standard Pilot)',
    expectedImpact: 'Reduce defect slip rate from 4% to under 0.1%. Minimize assembly line stop-times by 22% by flagging structural defects prior to subsequent component layers.',
    submittedAt: '2026-06-22T10:00:00Z',
    status: 'Technical Review',
    attachments: [
      { name: 'camera_specs_costing.docx', size: '1.1 MB', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
    ],
    reviewHistory: [
      {
        id: 'rev_4',
        statusFrom: 'None',
        statusTo: 'Submitted',
        actionBy: 'Dr. Marcus Vance',
        actionByRole: 'admin',
        comments: 'Proposal submitted. Requires local edge hardware deployment.',
        timestamp: '2026-06-22T10:00:00Z',
      },
      {
        id: 'rev_5',
        statusFrom: 'Submitted',
        statusTo: 'Under Review',
        actionBy: 'Admin Board',
        actionByRole: 'admin',
        comments: 'Initial validation complete. Routing to hardware and engineering teams for edge review.',
        timestamp: '2026-06-23T16:40:00Z',
      },
      {
        id: 'rev_6',
        statusFrom: 'Under Review',
        statusTo: 'Technical Review',
        actionBy: 'Hardware Committee (Tech Review)',
        actionByRole: 'admin',
        comments: 'Edge processing requirements are demanding. We need Marcus to specify heat dispersal limits of the camera enclosure on Line 4 and confirm physical clearance.',
        timestamp: '2026-06-26T09:12:00Z',
      },
    ],
  },
  {
    id: 'APP-2026-003',
    title: 'NLP Competitor Sentiment Tracker & Sales Oracle',
    applicantId: 'usr_1',
    applicantName: 'Sarah Jenkins',
    applicantEmail: 'applicant@company.ai',
    department: 'Customer Experience Operations',
    category: 'NLP & Sentiment Analysis',
    description: 'We currently review market trends manually, leading to delayed pricing strategies. This applet automates scraping of press releases, customer forums, and social media mentions of competitor products to score market sentiment in real-time.',
    proposedSolution: 'Scraping pipeline hosted in cloud run parsing RSS and public social feeds. Sentiment indices are grouped by product category and updated hourly onto a sales forecasting dashboard.',
    teamSize: 2,
    budget: 15000,
    timeline: '3 Months (Short Term MVP)',
    expectedImpact: 'Equip sales teams with dynamic competitor pricing counter-arguments 4 days faster than previous manual reports. Lift conversion rates by an expected 3.5%.',
    submittedAt: '2026-06-28T14:22:00Z',
    status: 'Submitted',
    attachments: [],
    reviewHistory: [
      {
        id: 'rev_7',
        statusFrom: 'None',
        statusTo: 'Submitted',
        actionBy: 'Sarah Jenkins',
        actionByRole: 'admin',
        comments: 'Submitted initial proposal. Budget is extremely modest and setup is lightweight.',
        timestamp: '2026-06-28T14:22:00Z',
      },
    ],
  }
];
