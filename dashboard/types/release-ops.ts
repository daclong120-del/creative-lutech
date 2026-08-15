export type ReleaseStatus = 
  | 'draft'
  | 'building'
  | 'in_review'
  | 'rolling_out'
  | 'live'
  | 'rejected'
  | 'halted'
  | 'failed'
  | 'policy_blocked';

export type TrackType = 'production' | 'beta' | 'alpha' | 'internal';

export type DataSourceType = 'play_api' | 'ci_webhook' | 'manual_checklist' | 'report_import' | 'estimated';

export interface DataProvenance {
  source: DataSourceType;
  sourceName: string;
  lastSyncAt: string;
  isStale: boolean;
}

export interface ReleaseReadinessGate {
  precheckPassed: boolean;
  crashRatePct: number;
  anrRatePct: number;
  policyStatus: 'clean' | 'under_appeal' | 'blocked';
  dataSafetyComplete: boolean;
  releaseNotesLocalesCount: number;
  versionCodeVerified: boolean;
  playReviewApproved: boolean;
  snapshotMatched: boolean;
}

export interface RolloutHealthGuard {
  crashRatePct: number;
  anrRatePct: number;
  badBehaviorStatus: 'healthy' | 'warning' | 'critical';
  installVolumeAtCurrent: number;
  recommendation: 'safe_to_increase' | 'hold' | 'halt_recommended';
  countrySpikes: string[];
}

export interface ReviewLifecycleDetails {
  submittedAt: string;
  reviewAgeHours: number;
  slaHours: number;
  policyCategory: string;
  appealStatus: 'none' | 'in_progress' | 'approved' | 'rejected';
  lastRejectionId?: string;
  requiredActionOwner: string;
  resubmissionReady: boolean;
}

export interface ReleaseTimelineStep {
  step: 'build' | 'upload' | 'submitted' | 'reviewed' | 'rollout' | 'live';
  label: string;
  timestamp: string;
  completed: boolean;
}

export interface AppReleaseItem {
  id: string;
  appName: string;
  packageName: string;
  iconUrl?: string;
  accountName: string;
  accountId: string;
  track: TrackType;
  status: ReleaseStatus;
  versionName: string;
  versionCode: number;
  rolloutPercentage: number;
  updatedAt: string;
  geoWarningsCount: number;
  targetSdk: number;
  rejectionReason?: string;
  provenance: DataProvenance;
  readinessGate: ReleaseReadinessGate;
  healthGuard: RolloutHealthGuard;
  reviewLifecycle?: ReviewLifecycleDetails;
  timeline: ReleaseTimelineStep[];
  actionDisabledReason?: string;
}

export interface AppRegistryItem {
  id: string;
  appName: string;
  packageName: string;
  accountName: string;
  status: 'active' | 'onboarding' | 'suspended';
  currentVersion: string;
  targetSdk: number;
  teamOwner: string;
  category: string;
  hasAds: boolean;
  privacyPolicyUrl: string;
  dataSafetyStatus: 'verified' | 'pending' | 'action_required';
  localeCoverageCount: number;
  totalSupportedLocales: number;
  checklistProgress: {
    total: number;
    completed: number;
  };
  createdAt: string;
}

export interface PreCheckItem {
  name: string;
  passed: boolean;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface ArtifactProvenance {
  commitSha: string;
  ciBuildId: string;
  branchTag: string;
  expectedKeystoreSha256: string;
  actualKeystoreSha256: string;
  minSdk: number;
  targetSdk: number;
  versionName: string;
  versionCode: number;
  checksumSha256: string;
  buildFlavor: string;
  hasMappingFile: boolean;
}

export interface UploadJobItem {
  id: string;
  appName: string;
  packageName: string;
  fileName: string;
  fileSizeBytes: number;
  track: TrackType;
  status: 'queued' | 'validating' | 'uploading' | 'completed' | 'failed';
  progress: number;
  preChecks: PreCheckItem[];
  artifact: ArtifactProvenance;
  releaseNotesByLocale: Record<string, string>;
  createdAt: string;
}

export interface ASOGeoWarningDetail {
  countryCode: string;
  countryName: string;
  visitors: number;
  conversionRate: number;
  reason: string;
  suggestedAction: string;
}

export interface ASOConversionMetric {
  packageName: string;
  appName: string;
  conversionRate: number;
  rateChange: number;
  monthlyInstalls: number;
  monthlyVisitors: number;
  vsPeersPct: number;
  rating: number;
  geoWarnings: string[];
  geoWarningDetails: ASOGeoWarningDetail[];
  topGeo: string;
  dataSourceLabel: string;
  experimentStatus: 'none' | 'running_ab' | 'winner_applied';
  dateRange: string;
}

export interface BatchAppPreviewItem {
  packageName: string;
  appName: string;
  isEligible: boolean;
  blockedReason?: string;
  canaryGroup: string;
}

export interface BatchOperationItem {
  id: string;
  type: 'canary_rollout' | 'mass_promote' | 'sdk_upgrade' | 'halt_all';
  title: string;
  totalApps: number;
  status: 'draft' | 'running' | 'completed' | 'failed' | 'paused';
  scheduledTime: string;
  riskLevel: 'low' | 'medium' | 'high';
  completedApps: number;
  affectedAppsPreview: BatchAppPreviewItem[];
  rollbackPlan: string;
}

export interface TargetSDKPolicyConfig {
  policySource: string;
  requiredApiLevel: number;
  deadlineDate: string;
  gracePeriodDays: number;
  isMandatory: boolean;
}

export interface TargetSDKItem {
  packageName: string;
  appName: string;
  currentSdk: number;
  targetSdk: number;
  deadline: string;
  daysRemaining: number;
  status: 'compliant' | 'warning' | 'urgent';
}

export interface PlayAccountScope {
  scopeName: string;
  granted: boolean;
}

export interface PlayAccountItem {
  id: string;
  name: string;
  email: string;
  status: 'healthy' | 'warning' | 'error';
  totalApps: number;
  lastSyncAt: string;
  quotaUsedPercentage: number;
  keyAgeDays: number;
  credentialExpiryDate: string;
  scopes: PlayAccountScope[];
  lastAuthError?: string;
}

export interface ApprovalAuditContext {
  requestedBy: string;
  approverRoleRequired: string;
  businessReason: string;
  ticketRef: string;
  idempotencyKey: string;
  stateBefore: string;
  stateAfter: string;
}
