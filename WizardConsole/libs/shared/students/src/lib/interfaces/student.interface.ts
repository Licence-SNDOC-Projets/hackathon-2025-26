/**
 * Interfaces communes pour la gestion des étudiants
 * Utilisables côté NestJS et Angular
 */

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  studentId: string; // Numéro étudiant
  promotion: string; // Ex: "2025-2026"
  specialization: StudentSpecialization;
  skills: SkillProfile;
  preferences: StudentPreferences;
  status: StudentStatus;
  teamId?: string; // ID de l'équipe assignée
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillProfile {
  technical: TechnicalSkills;
  soft: SoftSkills;
  experience: ExperienceLevel;
  interests: string[];
}

export interface TechnicalSkills {
  programming: ProgrammingSkills;
  electronics: number; // 1-5
  mechanics: number; // 1-5
  iot: number; // 1-5
  networking: number; // 1-5
}

export interface ProgrammingSkills {
  languages: ProgrammingLanguage[];
  frameworks: string[];
  databases: string[];
  tools: string[];
  overallLevel: number; // 1-5
}

export interface ProgrammingLanguage {
  name: string;
  level: number; // 1-5
  yearsOfExperience: number;
}

export interface SoftSkills {
  teamwork: number; // 1-5
  leadership: number; // 1-5
  communication: number; // 1-5
  problemSolving: number; // 1-5
  creativity: number; // 1-5
  adaptability: number; // 1-5
}

export interface StudentPreferences {
  preferredRoles: PreferredRole[];
  workingStyle: WorkingStyle;
  availability: AvailabilitySchedule;
  teamSizePreference: TeamSizePreference;
  challengePreferences: string[];
  avoidances: string[]; // Choses à éviter
}

export interface AvailabilitySchedule {
  timezone: string;
  weekdays: DayAvailability[];
  weekend: boolean;
  totalHoursPerWeek: number;
}

export interface DayAvailability {
  day: DayOfWeek;
  available: boolean;
  timeSlots: TimeSlot[];
}

export interface TimeSlot {
  start: string; // Format HH:MM
  end: string; // Format HH:MM
}

export interface StudentStatus {
  isActive: boolean;
  lastLoginDate: Date;
  currentActivity: string;
  location?: string;
  profileCompleteness: number; // 0-100%
}

// Types énumérés
export type StudentSpecialization = 
  | 'computer-science'
  | 'electronics'
  | 'robotics' 
  | 'iot'
  | 'cybersecurity'
  | 'data-science'
  | 'mechanical-engineering'
  | 'general';

export type PreferredRole = 
  | 'captain'
  | 'lead-developer'
  | 'backend-developer'
  | 'frontend-developer'
  | 'electronics-engineer'
  | 'mechanical-engineer'
  | 'designer'
  | 'tester'
  | 'documentation'
  | 'project-manager';

export type WorkingStyle = 
  | 'methodical'
  | 'creative'
  | 'fast-paced'
  | 'analytical'
  | 'collaborative'
  | 'independent';

export type TeamSizePreference = 'small' | 'medium' | 'large' | 'no-preference';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// DTOs pour la création et mise à jour
export interface CreateStudentDto {
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  promotion: string;
  specialization: StudentSpecialization;
}

export interface UpdateStudentProfileDto {
  skills?: Partial<SkillProfile>;
  preferences?: Partial<StudentPreferences>;
  displayName?: string;
  specialization?: StudentSpecialization;
}

export interface StudentSelfAssessmentDto {
  technical: Partial<TechnicalSkills>;
  soft: Partial<SoftSkills>;
  preferences: Partial<StudentPreferences>;
  interests: string[];
  previousExperience?: PreviousExperience[];
}

export interface PreviousExperience {
  type: ExperienceType;
  title: string;
  description: string;
  duration: string;
  skills: string[];
  year: number;
}

export type ExperienceType = 
  | 'project'
  | 'internship'
  | 'hackathon'
  | 'course'
  | 'personal'
  | 'professional';

// Interface pour l'import/export de données étudiants
export interface StudentImportData {
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  promotion: string;
  specialization?: string;
  additionalInfo?: Record<string, any>;
}

export interface BulkStudentImportResult {
  success: StudentImportData[];
  errors: StudentImportError[];
  total: number;
  imported: number;
  failed: number;
}

export interface StudentImportError {
  row: number;
  data: StudentImportData;
  errors: string[];
}