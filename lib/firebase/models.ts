// Firestore document types. Relations are loaded explicitly by the repository.
export type Role = "USER" | "ADMIN";
export type RegistrationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type AnnouncementStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED";
export type TeamRole = "LEADER" | "MEMBER";
export interface User {
  _count: Record<string, number>;
  id: string;
  email: string;
  passwordHash: string;
  firebaseUid: string | null;
  role: Role;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  notifications: Notification[];
  sessions: Session[];
  verifications: VerificationToken[];
  passwordResets: PasswordResetToken[];
  profile: Profile | null;
  teamMembership: TeamMember | null;
  ledTeams: Team[];
  submissions: RegistrationSubmission[];
  auditLogs: AuditLog[];
}
export interface Session {
  _count: Record<string, number>;
  id: string;
  userId: string;
  token: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}
export interface VerificationToken {
  _count: Record<string, number>;
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
  user: User;
}
export interface PasswordResetToken {
  _count: Record<string, number>;
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
  user: User;
}
export interface Profile {
  _count: Record<string, number>;
  id: string;
  userId: string;
  fullName: string;
  collegeOrg: string;
  cityState: string;
  skills: string;
  aiExperience: string;
  phone: string | null;
  department: string | null;
  studyYear: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  privacyConsent: boolean;
  rulesAccepted: boolean;
  rulesVersion: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}
export interface Team {
  _count: Record<string, number>;
  id: string;
  name: string;
  leaderId: string;
  isSolo: boolean;
  createdAt: Date;
  updatedAt: Date;
  leader: User;
  members: TeamMember[];
  invitations: TeamInvitation[];
  submission: RegistrationSubmission | null;
}
export interface TeamMember {
  _count: Record<string, number>;
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: Date;
  team: Team;
  user: User;
}
export interface TeamInvitation {
  _count: Record<string, number>;
  id: string;
  teamId: string;
  email: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
  team: Team;
}
export interface RegistrationSubmission {
  _count: Record<string, number>;
  id: string;
  registrationId: string;
  teamId: string;
  submittedById: string;
  status: RegistrationStatus;
  rejectionReason: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  reviewedById: string | null;
  team: Team;
  submittedBy: User;
}
export interface EventConfig {
  _count: Record<string, number>;
  id: string;
  key: string;
  value: string;
  updatedAt: Date;
}
export interface Announcement {
  _count: Record<string, number>;
  id: string;
  title: string;
  content: string;
  status: AnnouncementStatus;
  scheduledFor: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
export interface ContactMessage {
  _count: Record<string, number>;
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}
export interface ProblemStatement {
  _count: Record<string, number>;
  id: string;
  status: AnnouncementStatus;
  identifier: string | null;
  trackId: string | null;
  trackRelation: Track | null;
  title: string;
  track: string;
  description: string;
  datasetsUrl: string | null;
  evaluationCriteria: string | null;
  createdAt: Date;
  updatedAt: Date;
}
export interface AuditLog {
  _count: Record<string, number>;
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: Date;
  user: User | null;
}
export interface Event {
  _count: Record<string, number>;
  id: string;
  slug: string;
  title: string;
  description: string;
  timezone: string;
  startsAt: Date | null;
  endsAt: Date | null;
  venue: string | null;
  mode: string | null;
  settings: EventSettings | null;
  tracks: Track[];
  schedule: ScheduleItem[];
  prizes: Prize[];
  faqs: FAQ[];
  sponsors: Sponsor[];
  createdAt: Date;
  updatedAt: Date;
}
export interface EventSettings {
  _count: Record<string, number>;
  id: string;
  eventId: string;
  event: Event;
  minTeamSize: number;
  maxTeamSize: number;
  allowSolo: boolean;
  registrationDeadline: Date | null;
  teamEditingDeadline: Date | null;
  updatedAt: Date;
}
export interface Track {
  _count: Record<string, number>;
  id: string;
  eventId: string;
  event: Event;
  title: string;
  description: string;
  published: boolean;
  position: number;
  problems: ProblemStatement[];
  createdAt: Date;
  updatedAt: Date;
}
export interface ScheduleItem {
  _count: Record<string, number>;
  id: string;
  eventId: string;
  event: Event;
  title: string;
  description: string;
  startsAt: Date | null;
  published: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface Prize {
  _count: Record<string, number>;
  id: string;
  eventId: string;
  event: Event;
  title: string;
  description: string;
  published: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface FAQ {
  _count: Record<string, number>;
  id: string;
  eventId: string;
  event: Event;
  title: string;
  description: string;
  published: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface Sponsor {
  _count: Record<string, number>;
  id: string;
  eventId: string;
  event: Event;
  title: string;
  description: string;
  url: string | null;
  published: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface Notification {
  _count: Record<string, number>;
  id: string;
  userId: string;
  user: User;
  title: string;
  message: string;
  readAt: Date | null;
  createdAt: Date;
}
export interface RateLimitBucket {
  _count: Record<string, number>;
  key: string;
  count: number;
  resetAt: Date;
  id: string;
}
export interface EmailOutbox {
  _count: Record<string, number>;
  id: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  deliveredAt: Date | null;
  attempts: number;
  lastError: string | null;
  createdAt: Date;
}
export interface Models {
  firebaseDeletion: { id: string; createdAt: Date; _count: Record<string, number> };
  user: User;
  session: Session;
  verificationToken: VerificationToken;
  passwordResetToken: PasswordResetToken;
  profile: Profile;
  team: Team;
  teamMember: TeamMember;
  teamInvitation: TeamInvitation;
  registrationSubmission: RegistrationSubmission;
  eventConfig: EventConfig;
  announcement: Announcement;
  contactMessage: ContactMessage;
  problemStatement: ProblemStatement;
  auditLog: AuditLog;
  event: Event;
  eventSettings: EventSettings;
  track: Track;
  scheduleItem: ScheduleItem;
  prize: Prize;
  fAQ: FAQ;
  sponsor: Sponsor;
  notification: Notification;
  rateLimitBucket: RateLimitBucket;
  emailOutbox: EmailOutbox;
}
