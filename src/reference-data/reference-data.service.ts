import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReferenceDataService {
constructor(private prisma: PrismaService) {}

getAgeGroups() {
return this.prisma.ageGroup.findMany();
}

getAssessmentActivities(ageGroupId?: string) {
return this.prisma.assessmentActivity.findMany({
where: ageGroupId ? { ageGroupId } : undefined,
});
}

getSystemPrompts() {
return this.prisma.systemPrompt.findMany();
}

getAppConfig() {
return this.prisma.appConfig.findMany();
}
}