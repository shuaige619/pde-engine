import { PrismaClient, UserRole, UserStatus, ProjectStatus, RequirementType, RequirementStatus, SprintStatus, TaskType, TaskStatus, Priority, ArtifactType, ArtifactStatus, BugSeverity, BugStatus, DocumentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const startTime = Date.now();
  console.log('🌱 Starting database seed...\n');

  // ==========================================
  // 1. Create Admin User
  // ==========================================
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@pde.local';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      username: 'admin',
      password: hashedPassword,
      name: 'System Administrator',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      lastLogin: new Date(),
    },
  });
  console.log(`✅ Admin user created: ${admin.email} (${admin.role})`);

  // ==========================================
  // 2. Create Demo Users
  // ==========================================
  const demoUsers = [
    { email: 'pm@pde.local', username: 'productmanager', name: 'Product Manager', role: UserRole.USER },
    { email: 'dev@pde.local', username: 'developer', name: 'Developer', role: UserRole.EDITOR },
    { email: 'viewer@pde.local', username: 'viewer', name: 'Viewer', role: UserRole.VIEWER },
  ];

  for (const userData of demoUsers) {
    const hashed = await bcrypt.hash('demo123', 12);
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        password: hashed,
        status: UserStatus.ACTIVE,
      },
    });
    console.log(`✅ Demo user created: ${user.email} (${user.role})`);
  }

  // ==========================================
  // 3. Create System Configurations
  // ==========================================
  const configs = [
    {
      key: 'app.name',
      value: 'PDE Engine - Production Development Integration Platform',
      description: 'Application display name',
      isPublic: true,
    },
    {
      key: 'app.version',
      value: '1.0.0',
      description: 'Current application version',
      isPublic: true,
    },
    {
      key: 'app.maintenance',
      value: false,
      description: 'Maintenance mode toggle',
      isPublic: true,
    },
    {
      key: 'auth.jwt.expiresIn',
      value: '7d',
      description: 'JWT token expiration time',
      isPublic: false,
    },
    {
      key: 'auth.maxLoginAttempts',
      value: 5,
      description: 'Maximum login attempts before lockout',
      isPublic: false,
    },
    {
      key: 'auth.lockoutDuration',
      value: 900,
      description: 'Account lockout duration in seconds (15 minutes)',
      isPublic: false,
    },
    {
      key: 'upload.maxFileSize',
      value: 10485760,
      description: 'Maximum upload file size in bytes (10MB)',
      isPublic: true,
    },
    {
      key: 'upload.allowedTypes',
      value: ['image/png', 'image/jpeg', 'image/gif', 'application/pdf', 'application/zip', 'text/plain'],
      description: 'Allowed file upload MIME types',
      isPublic: true,
    },
    {
      key: 'features.auditLog',
      value: true,
      description: 'Enable audit logging',
      isPublic: false,
    },
    {
      key: 'features.swagger',
      value: true,
      description: 'Enable Swagger API documentation',
      isPublic: false,
    },
    {
      key: 'notification.email.enabled',
      value: false,
      description: 'Enable email notifications',
      isPublic: false,
    },
    {
      key: 'notification.webhook.enabled',
      value: false,
      description: 'Enable webhook notifications',
      isPublic: false,
    },
    {
      key: 'pipeline.defaultTimeout',
      value: 3600000,
      description: 'Default pipeline timeout in milliseconds (1 hour)',
      isPublic: false,
    },
    {
      key: 'pipeline.maxConcurrentRuns',
      value: 5,
      description: 'Maximum concurrent pipeline runs per project',
      isPublic: false,
    },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }
  console.log(`✅ ${configs.length} system configs created`);

  // ==========================================
  // 4. Create Demo Project
  // ==========================================
  const demoProject = await prisma.project.upsert({
    where: { code: 'DEMO-001' },
    update: {},
    create: {
      code: 'DEMO-001',
      name: 'PDE Engine Development',
      description: 'Production-Development Integration Platform core development project.',
      status: ProjectStatus.IN_PROGRESS,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      ownerId: admin.id,
    },
  });
  console.log(`✅ Demo project created: ${demoProject.code} - ${demoProject.name}`);

  // ==========================================
  // 5. Add Project Members
  // ==========================================
  const allUsers = await prisma.user.findMany({ where: { id: { not: admin.id } } });
  for (const user of allUsers) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: demoProject.id, userId: user.id } },
      update: {},
      create: {
        projectId: demoProject.id,
        userId: user.id,
      },
    });
  }
  console.log(`✅ Added ${allUsers.length} members to demo project`);

  // ==========================================
  // 6. Create Demo Requirements
  // ==========================================
  const requirements = [
    {
      projectId: demoProject.id,
      code: 'REQ-001',
      title: 'User Authentication System',
      description: 'Implement secure user authentication with JWT tokens, password hashing, and session management.',
      type: RequirementType.FUNCTIONAL,
      status: RequirementStatus.APPROVED,
      priority: Priority.HIGH,
      tags: ['auth', 'security', 'core'],
    },
    {
      projectId: demoProject.id,
      code: 'REQ-002',
      title: 'Project Management Module',
      description: 'Full CRUD operations for projects with member management and milestone tracking.',
      type: RequirementType.FUNCTIONAL,
      status: RequirementStatus.IMPLEMENTED,
      priority: Priority.HIGH,
      tags: ['project', 'core', 'management'],
    },
    {
      projectId: demoProject.id,
      code: 'REQ-003',
      title: 'Requirement Tracking System',
      description: 'Manage product requirements with hierarchy support, status tracking, and traceability.',
      type: RequirementType.FUNCTIONAL,
      status: RequirementStatus.IMPLEMENTED,
      priority: Priority.HIGH,
      tags: ['requirement', 'tracking', 'core'],
    },
    {
      projectId: demoProject.id,
      code: 'REQ-004',
      title: 'Sprint Planning & Management',
      description: 'Support agile sprint planning with task allocation, burndown charts, and velocity tracking.',
      type: RequirementType.FUNCTIONAL,
      status: RequirementStatus.APPROVED,
      priority: Priority.MEDIUM,
      tags: ['sprint', 'agile', 'planning'],
    },
    {
      projectId: demoProject.id,
      code: 'REQ-005',
      title: 'Bug & Issue Tracking',
      description: 'Comprehensive bug tracking system with severity levels, lifecycle management, and reporting.',
      type: RequirementType.FUNCTIONAL,
      status: RequirementStatus.APPROVED,
      priority: Priority.HIGH,
      tags: ['bug', 'issue', 'tracking'],
    },
    {
      projectId: demoProject.id,
      code: 'REQ-006',
      title: 'Artifact Repository',
      description: 'Versioned artifact storage and management with metadata tracking and retrieval.',
      type: RequirementType.FUNCTIONAL,
      status: RequirementStatus.APPROVED,
      priority: Priority.MEDIUM,
      tags: ['artifact', 'storage', 'versioning'],
    },
    {
      projectId: demoProject.id,
      code: 'REQ-007',
      title: 'CI/CD Pipeline Integration',
      description: 'Automated build, test, and deployment pipeline management with status monitoring.',
      type: RequirementType.TECHNICAL,
      status: RequirementStatus.DRAFT,
      priority: Priority.HIGH,
      tags: ['ci-cd', 'pipeline', 'automation'],
    },
    {
      projectId: demoProject.id,
      code: 'REQ-008',
      title: 'Performance: API Response Time',
      description: 'API endpoints should respond within 200ms under normal load (p95).',
      type: RequirementType.NON_FUNCTIONAL,
      status: RequirementStatus.APPROVED,
      priority: Priority.MEDIUM,
      tags: ['performance', 'api', 'nfr'],
    },
  ];

  for (const req of requirements) {
    await prisma.requirement.upsert({
      where: { projectId_code: { projectId: req.projectId, code: req.code } },
      update: {},
      create: req,
    });
  }
  console.log(`✅ ${requirements.length} demo requirements created`);

  // ==========================================
  // 7. Create Demo Sprint
  // ==========================================
  const sprint = await prisma.sprint.upsert({
    where: { id: 'sprint-1' },
    update: {},
    create: {
      projectId: demoProject.id,
      name: 'Sprint 1 - Foundation',
      goal: 'Establish core infrastructure and authentication system',
      status: SprintStatus.ACTIVE,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-14'),
    },
  });
  console.log(`✅ Demo sprint created: ${sprint.name}`);

  // ==========================================
  // 8. Create Demo Tasks
  // ==========================================
  const devUser = await prisma.user.findUnique({ where: { email: 'dev@pde.local' } });
  const tasks = [
    {
      projectId: demoProject.id,
      sprintId: sprint.id,
      title: 'Setup PostgreSQL database schema',
      description: 'Create initial database schema with Prisma ORM including all core tables.',
      type: TaskType.DEVELOPMENT,
      status: TaskStatus.DONE,
      priority: Priority.HIGH,
      storyPoints: 5,
      estimatedHours: 8,
      actualHours: 6,
      tags: ['database', 'setup', 'infrastructure'],
      createdBy: admin.id,
      assigneeId: devUser?.id,
    },
    {
      projectId: demoProject.id,
      sprintId: sprint.id,
      title: 'Implement JWT authentication middleware',
      description: 'Create JWT token generation, validation, and refresh token logic.',
      type: TaskType.DEVELOPMENT,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      storyPoints: 8,
      estimatedHours: 12,
      actualHours: 6,
      tags: ['auth', 'jwt', 'middleware'],
      createdBy: admin.id,
      assigneeId: devUser?.id,
    },
    {
      projectId: demoProject.id,
      sprintId: sprint.id,
      title: 'Design REST API endpoints',
      description: 'Define API contracts, request/response schemas, and endpoint routing.',
      type: TaskType.DESIGN,
      status: TaskStatus.DONE,
      priority: Priority.HIGH,
      storyPoints: 5,
      estimatedHours: 8,
      actualHours: 8,
      tags: ['api', 'design', 'documentation'],
      createdBy: admin.id,
      assigneeId: devUser?.id,
    },
    {
      projectId: demoProject.id,
      sprintId: sprint.id,
      title: 'Setup Redis caching layer',
      description: 'Configure Redis for session storage and application caching.',
      type: TaskType.DEVELOPMENT,
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      storyPoints: 3,
      estimatedHours: 4,
      tags: ['redis', 'cache', 'infrastructure'],
      createdBy: admin.id,
      assigneeId: devUser?.id,
    },
    {
      projectId: demoProject.id,
      sprintId: sprint.id,
      title: 'Configure RabbitMQ message queue',
      description: 'Setup message queue for async job processing and event distribution.',
      type: TaskType.DEVELOPMENT,
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      storyPoints: 5,
      estimatedHours: 6,
      tags: ['rabbitmq', 'queue', 'infrastructure'],
      createdBy: admin.id,
      assigneeId: devUser?.id,
    },
  ];

  for (const task of tasks) {
    await prisma.task.create({ data: task });
  }
  console.log(`✅ ${tasks.length} demo tasks created`);

  // ==========================================
  // 9. Create Demo Bugs
  // ==========================================
  const bugs = [
    {
      projectId: demoProject.id,
      title: 'Login form validation fails on edge case emails',
      description: 'Email validation regex does not accept plus-addressing format (e.g., user+tag@domain.com).',
      severity: BugSeverity.MAJOR,
      status: BugStatus.CONFIRMED,
      priority: Priority.HIGH,
      stepsToReproduce: '1. Go to login page\n2. Enter email with + sign\n3. Submit form\n4. Observe validation error',
      environment: 'Chrome 120, Firefox 121',
      tags: ['bug', 'auth', 'validation'],
      reportedBy: admin.id,
      assigneeId: devUser?.id,
    },
    {
      projectId: demoProject.id,
      title: 'API rate limiter returns incorrect status code',
      description: 'When rate limit is exceeded, API returns 500 instead of 429 Too Many Requests.',
      severity: BugSeverity.MINOR,
      status: BugStatus.NEW,
      priority: Priority.MEDIUM,
      stepsToReproduce: '1. Send 101 requests to /api/login within 15 minutes\n2. Observe 500 error instead of 429',
      environment: 'Node.js 20, Express 4.19',
      tags: ['bug', 'api', 'rate-limit'],
      reportedBy: admin.id,
    },
  ];

  for (const bug of bugs) {
    await prisma.bug.create({ data: bug });
  }
  console.log(`✅ ${bugs.length} demo bugs created`);

  // ==========================================
  // 10. Create Demo Artifacts
  // ==========================================
  const artifacts = [
    {
      projectId: demoProject.id,
      name: 'architecture-diagram',
      version: '1.0.0',
      type: ArtifactType.DOCUMENT,
      status: ArtifactStatus.PUBLISHED,
      description: 'System architecture overview diagram showing microservices interaction.',
      tags: ['architecture', 'diagram'],
    },
    {
      projectId: demoProject.id,
      name: 'api-spec-v1',
      version: '1.0.0',
      type: ArtifactType.DOCUMENT,
      status: ArtifactStatus.REVIEWING,
      description: 'OpenAPI 3.0 specification for all REST API endpoints.',
      tags: ['api', 'specification', 'openapi'],
    },
    {
      projectId: demoProject.id,
      name: 'deployment-package',
      version: '0.1.0-alpha',
      type: ArtifactType.ARCHIVE,
      status: ArtifactStatus.DRAFT,
      description: 'Docker compose deployment package for staging environment.',
      tags: ['deployment', 'docker', 'staging'],
    },
  ];

  for (const artifact of artifacts) {
    await prisma.artifact.create({ data: artifact });
  }
  console.log(`✅ ${artifacts.length} demo artifacts created`);

  // ==========================================
  // 11. Create Demo Documents
  // ==========================================
  const documents = [
    {
      projectId: demoProject.id,
      title: 'Getting Started Guide',
      slug: 'getting-started',
      content: '# Getting Started with PDE Engine\n\nWelcome to the PDE Engine platform...',
      status: DocumentStatus.PUBLISHED,
      authorId: admin.id,
      publishedAt: new Date(),
      tags: ['guide', 'documentation'],
    },
    {
      projectId: demoProject.id,
      title: 'API Authentication Guide',
      slug: 'api-authentication',
      content: '# API Authentication\n\nAll API requests must include a valid JWT token...',
      status: DocumentStatus.PUBLISHED,
      authorId: admin.id,
      publishedAt: new Date(),
      tags: ['api', 'auth', 'documentation'],
    },
    {
      projectId: demoProject.id,
      title: 'Development Standards',
      slug: 'development-standards',
      content: '# Development Standards\n\n## Code Style\n- Use TypeScript strict mode...',
      status: DocumentStatus.DRAFT,
      authorId: admin.id,
      tags: ['standards', 'development'],
    },
  ];

  for (const doc of documents) {
    await prisma.document.create({ data: doc });
  }
  console.log(`✅ ${documents.length} demo documents created`);

  // ==========================================
  // 12. Create Demo Pipeline
  // ==========================================
  const pipeline = await prisma.pipeline.create({
    data: {
      projectId: demoProject.id,
      name: 'CI Build Pipeline',
      description: 'Continuous integration pipeline for automated testing and building.',
      triggerOn: ['push', 'pr'],
      config: {
        stages: [
          { name: 'install', commands: ['npm ci'] },
          { name: 'lint', commands: ['npm run lint'] },
          { name: 'typecheck', commands: ['npm run typecheck'] },
          { name: 'test', commands: ['npm test'] },
          { name: 'build', commands: ['npm run build'] },
        ],
      },
    },
  });
  console.log(`✅ Demo pipeline created: ${pipeline.name}`);

  // ==========================================
  // 13. Create Demo Audit Logs
  // ==========================================
  const auditLogs = [
    {
      userId: admin.id,
      action: 'LOGIN' as const,
      entity: 'User',
      entityId: admin.id,
      details: { method: 'password' },
      ipAddress: '127.0.0.1',
      userAgent: 'Seed Script',
    },
    {
      userId: admin.id,
      action: 'CREATE' as const,
      entity: 'SystemConfig',
      details: { count: configs.length },
      ipAddress: '127.0.0.1',
      userAgent: 'Seed Script',
    },
    {
      userId: admin.id,
      action: 'CREATE' as const,
      entity: 'Project',
      entityId: demoProject.id,
      details: { code: demoProject.code },
      ipAddress: '127.0.0.1',
      userAgent: 'Seed Script',
    },
  ];

  for (const log of auditLogs) {
    await prisma.auditLog.create({ data: log });
  }
  console.log(`✅ ${auditLogs.length} demo audit logs created`);

  const duration = Date.now() - startTime;
  console.log(`\n✨ Seed completed in ${duration}ms`);
  console.log(`\n📋 Summary:`);
  console.log(`   Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`   Demo users: ${demoUsers.length}`);
  console.log(`   System configs: ${configs.length}`);
  console.log(`   Demo project: ${demoProject.code}`);
  console.log(`   Requirements: ${requirements.length}`);
  console.log(`   Sprints: 1`);
  console.log(`   Tasks: ${tasks.length}`);
  console.log(`   Bugs: ${bugs.length}`);
  console.log(`   Artifacts: ${artifacts.length}`);
  console.log(`   Documents: ${documents.length}`);
  console.log(`   Pipelines: 1`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error('Seed error:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
