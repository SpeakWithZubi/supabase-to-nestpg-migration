import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReferenceDataService } from './reference-data.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class ReferenceDataController {
constructor(private readonly referenceDataService: ReferenceDataService) {}

@Get('age-groups')
getAgeGroups() {
return this.referenceDataService.getAgeGroups();
}

@Get('assessment-activities')
getAssessmentActivities(@Query('age_group_id') ageGroupId?: string) {
return this.referenceDataService.getAssessmentActivities(ageGroupId);
}

@Get('system-prompts')
getSystemPrompts() {
return this.referenceDataService.getSystemPrompts();
}

@Get('app-config')
getAppConfig() {
return this.referenceDataService.getAppConfig();
}
}